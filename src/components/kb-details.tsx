import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible block used by the knowledge-base renderer for
 * `[details] Summary ... [/details]` markdown blocks. Open/closed state
 * is persisted in localStorage under a stable key derived from the
 * article id + summary text, so a returning reader sees the same blocks
 * they expanded last visit. Falls back gracefully (closed) when
 * localStorage is unavailable.
 */
function storageKey(articleId: string, summary: string) {
  const slug = summary
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `kb-details:${articleId}:${slug}`;
}

function readPersisted(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writePersisted(key: string, open: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (open) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export interface KbDetailsProps {
  articleId: string;
  summary: React.ReactNode;
  summaryText: string;
  children: React.ReactNode;
}

export const KbDetails: React.FC<KbDetailsProps> = ({
  articleId,
  summary,
  summaryText,
  children,
}) => {
  const key = storageKey(articleId, summaryText);
  // Start closed during SSR / first paint; hydrate from storage after mount
  // so the markup matches between server and client.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(readPersisted(key));
  }, [key]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      writePersisted(key, next);
      return next;
    });
  };

  const panelId = `${key.replace(/[^\w-]/g, "_")}-panel`;
  const buttonId = `${panelId}-trigger`;

  return (
    <div className="my-2 border-b border-brand-hairline first:border-t" role="group">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => {
          // Native <button> handles Enter/Space, but we also support
          // ArrowDown to open and ArrowUp/Escape to close for parity with
          // common disclosure-widget keyboard patterns.
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
            writePersisted(key, true);
          } else if ((e.key === "ArrowUp" || e.key === "Escape") && open) {
            e.preventDefault();
            setOpen(false);
            writePersisted(key, false);
          }
        }}
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-sm py-3 text-left text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="h4">{summary}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 text-primary"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.2, ease: "easeOut" },
            }}
            className="overflow-hidden"
          >
            <div className="body pb-4 pl-1 pr-6 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
