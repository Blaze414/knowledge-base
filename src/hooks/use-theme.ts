import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "kb-theme";
export const THEME_CHANGE_EVENT = "kb-theme-change";

/**
 * Inline script injected into <head> BEFORE hydration to apply the user's
 * stored / system theme to <html>. Prevents flash of wrong theme and avoids
 * SSR/CSR hydration mismatches on theme-driven UI.
 */
export const themeBootstrapScript = `(() => {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();`;

function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  // Start as `null` on server + first client render so toggles don't render
  // theme-dependent UI before hydration completes.
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(readCurrentTheme());

    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next: Theme = e.newValue === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.dataset.theme = next;
      setThemeState(next);
    };
    const onThemeChange = () => setThemeState(readCurrentTheme());
    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
    };
  }, []);

  const setTheme = (next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeState(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const toggleTheme = () => setTheme((theme ?? readCurrentTheme()) === "dark" ? "light" : "dark");

  return { theme, setTheme, toggleTheme, mounted: theme !== null };
}
