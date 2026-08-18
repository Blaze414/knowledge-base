import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Chooser } from "@/content/choosers";
import { pageContents } from "@/content/articles";
import { IconTile } from "@/components/ui/icon-tile";
import { cardVariants } from "@/components/ui/card";

/**
 * Card-grid variant of the chooser. Renders the chooser's first step as a
 * responsive grid of cards — one per option — each linking directly to the
 * recommended article. Intended for a dedicated chooser page where the
 * question IS the page, so there's no "Step N" chrome and no section
 * numbering on the article titles.
 */
export const KbChooserCards: React.FC<{ chooser: Chooser }> = ({ chooser }) => {
  const step = chooser.steps.find((s) => s.id === chooser.start);
  // Respect the user's OS-level "reduce motion" preference. When enabled,
  // we drop hover translate, transition durations, and the badge's
  // scale-in animation so selection changes are instantaneous.
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  // Track the URL hash so a card can be highlighted when the page is opened
  // via direct URL/hash (e.g. `#settings-notifications-quiet-hours`). The
  // hash matches the target article id of one of the option cards.
  const [activeHash, setActiveHash] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""),
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setActiveHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("lovable:hashchange", sync as EventListener);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("lovable:hashchange", sync as EventListener);
    };
  }, []);
  // Map of pageId -> anchor element, so we can move keyboard focus to the
  // currently selected card whenever the URL hash changes. This makes the
  // highlighted option immediately reachable via Tab/Enter and announces it
  // to screen readers when arriving via direct link or back/forward nav.
  const cardRefs = useRef<Map<string, HTMLAnchorElement | null>>(new Map());
  useEffect(() => {
    if (typeof window === "undefined" || !activeHash) return;
    const el = cardRefs.current.get(activeHash);
    if (!el) return;
    // Avoid stealing focus from a user actively typing in an input/textarea.
    const ae = document.activeElement as HTMLElement | null;
    const tag = ae?.tagName;
    if (
      ae &&
      ae !== document.body &&
      (tag === "INPUT" || tag === "TEXTAREA" || ae.isContentEditable)
    ) {
      return;
    }
    // preventScroll: parent layout already handles scroll positioning for the
    // chooser page; we just want the focus ring to land on the right card.
    el.focus({ preventScroll: true });
  }, [activeHash]);
  if (!step) {
    return (
      <p className="body text-destructive">
        Chooser misconfigured: start step "{chooser.start}" not found.
      </p>
    );
  }

  return (
    <section
      aria-label={chooser.title ?? "Pick a guide"}
      className={cardVariants({ variant: "muted", className: "my-8 p-5 sm:p-7" })}
    >
      <header className="mb-5 flex items-start gap-3">
        <IconTile tone="blue" size="sm" className="mt-0.5">
          <Compass aria-hidden="true" />
        </IconTile>
        <div className="min-w-0">
          <h3 className="h3 text-foreground">{step.question}</h3>
          {chooser.intro && <p className="body mt-1 text-muted-foreground">{chooser.intro}</p>}
        </div>
      </header>

      <ul role="list" className="grid gap-3 sm:grid-cols-2">
        {step.options.map((opt, i) => {
          const isArticle = opt.next.startsWith("article:");
          const pageId = isArticle ? opt.next.slice("article:".length) : "";
          const page = pageId ? pageContents[pageId] : undefined;
          const title = page?.title ?? opt.label;
          const isActive = !!pageId && activeHash === pageId;

          if (!isArticle || !page) {
            return (
              <li key={i}>
                <div className="body h-full rounded-lg border border-brand-hairline bg-background p-4 text-muted-foreground">
                  {opt.label}
                </div>
              </li>
            );
          }

          return (
            <li key={i}>
              <Link
                to="/"
                search={(prev: Record<string, unknown>) => ({
                  ...prev,
                  page: pageId,
                })}
                ref={(el: HTMLAnchorElement | null) => {
                  if (el) cardRefs.current.set(pageId, el);
                  else cardRefs.current.delete(pageId);
                }}
                aria-current={isActive ? "true" : undefined}
                className={`group relative flex h-full flex-col gap-2 rounded-lg border bg-background p-4 shadow-panel-soft transition-[transform,box-shadow,border-color,background-color,outline-color,--tw-ring-color,--tw-ring-offset-width] ${
                  reduceMotion
                    ? "duration-0 hover:border-primary/60 hover:shadow-panel"
                    : "duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-panel"
                } outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:shadow-panel ring-0 ring-primary/40 ${
                  isActive
                    ? "border-primary ring-2 bg-primary/5 shadow-panel"
                    : "border-brand-hairline"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="h6 text-muted-foreground">If you…</span>
                  {isActive && (
                    <span
                      className={`small inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold uppercase text-primary ${
                        reduceMotion ? "" : "animate-scale-in"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Selected
                    </span>
                  )}
                </span>
                <span className="h4 text-foreground">{opt.label}</span>
                {opt.why && <span className="small text-muted-foreground">{opt.why}</span>}
                <span className="small mt-auto inline-flex items-center gap-1 pt-2 font-medium text-primary opacity-80 group-hover:opacity-100">
                  Open “{title}”
                  <ArrowRight
                    className={`h-3.5 w-3.5 ${
                      reduceMotion ? "" : "transition-transform group-hover:translate-x-0.5"
                    }`}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
