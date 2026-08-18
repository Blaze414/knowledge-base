import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  X,
  ZoomIn,
  Sun,
  Moon,
  Download,
  FileText,
  Menu,
  ThumbsDown,
  ThumbsUp,
  Check,
  Share2,
  ListTree,
  Sparkles,
} from "lucide-react";
import { ChevronLeft, Play, Pause } from "lucide-react";
import { XCircle, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { getVideo } from "@/content/videos";
import { getImage, type ImageRef } from "@/content/images";
import { getDocument, type DocRef } from "@/content/documents";
import { getSlideshow, type Slideshow } from "@/content/slideshows";
import { getQuiz, type Quiz } from "@/content/quizzes";
import { getChooser } from "@/content/choosers";
import { choosers as allChoosers } from "@/content/choosers";
import { KbChooser } from "@/components/kb-chooser";
import { KbChooserCards } from "@/components/kb-chooser-cards";
import { findCategoryForPage, sidebarCategories } from "@/content/categories";
import { pageContents, DEFAULT_PAGE_ID, getChildren } from "@/content/articles";
import { IconTile } from "@/components/ui/icon-tile";
import { cardVariants } from "@/components/ui/card";
import { getRelatedArticles } from "@/content/related";
import { useTheme } from "@/hooks/use-theme";
import { ContactSupportDialog } from "@/components/contact-support-dialog";
import { highlightText, highlightInline } from "@/components/kb-highlight";
import { renderInlineMarkdown } from "@/lib/inline-md";
import {
  KbCallout,
  parseCallout,
  consolidateCallouts,
  splitCalloutParagraphs,
} from "@/components/kb-callout";
import { getCallout } from "@/content/callouts";
import { useKbSearch } from "@/hooks/use-kb-search";
import { KbDetails } from "@/components/kb-details";
import { KbStickySteps, type StickyStep } from "@/components/kb-sticky-steps";
import { KnowledgeBaseHome } from "@/components/knowledge-base-home";
import { ImmersiveSlideshow } from "@/components/immersive-slideshow";
import { SmartSearchDialog } from "@/components/smart-search-dialog";
import { toast } from "sonner";
import { siteBrand } from "@/content/brand";

const MotionButton = motion.create(Button);

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const STEP_CUE_STYLES: Record<string, { label: string; className: string; tone: string }> = {
  action: {
    label: "Action:",
    className: "border-primary/25 bg-primary/10 text-primary",
    tone: "text-primary",
  },
  "expected outcome": {
    label: "Expected outcome:",
    className: "border-success/30 bg-success/10 text-success",
    tone: "text-success",
  },
  outcome: {
    label: "Expected outcome:",
    className: "border-success/30 bg-success/10 text-success",
    tone: "text-success",
  },
  note: {
    label: "Note:",
    className: "border-brand-hairline bg-muted text-muted-foreground",
    tone: "text-muted-foreground",
  },
  "important note": {
    label: "Important note:",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
    tone: "text-destructive",
  },
};

function parseStepCue(line: string) {
  const match = line
    .trim()
    .match(/^\*\*(Action|Expected outcome|Outcome|Note|Important note):\*\*\s*(.+)$/i);
  if (!match) return null;
  const key = match[1].toLowerCase();
  const imageDirective = match[2].match(/\s*\[image:([\w-]+)\]\s*$/i);
  const text = imageDirective ? match[2].slice(0, imageDirective.index).trim() : match[2].trim();
  return {
    key,
    text,
    imageKey: imageDirective?.[1],
    style: STEP_CUE_STYLES[key] ?? STEP_CUE_STYLES.note,
  };
}

function getStepCueImage(articleId: string, visualIndex: number, cueKey: string): ImageRef | null {
  const n = Math.max(1, visualIndex);
  if (articleId === "guides-photo-tour" && n === 1) {
    if (cueKey === "action") return getImage("peanuts-store-characters-menu") ?? null;
    if (cueKey === "expected outcome" || cueKey === "outcome") {
      return getImage("peanuts-store-snoopy-collection") ?? null;
    }
  }
  if (articleId === "guides-contact-store-support") {
    const supportImages: Record<number, { action: string; outcome: string }> = {
      1: {
        action: "peanuts-support-footer-link",
        outcome: "peanuts-support-center-home",
      },
      2: {
        action: "peanuts-support-center-home",
        outcome: "peanuts-support-message-link",
      },
      3: {
        action: "peanuts-support-message-link",
        outcome: "peanuts-support-submit-request",
      },
      4: {
        action: "peanuts-support-request-fields",
        outcome: "peanuts-support-request-fields",
      },
      5: {
        action: "peanuts-support-request-fields",
        outcome: "peanuts-support-submit-request",
      },
    };
    const imageKey = cueKey === "action" ? supportImages[n]?.action : supportImages[n]?.outcome;
    if (imageKey) return getImage(imageKey) ?? null;
  }
  if (articleId.startsWith("guides-lesson-plans")) {
    return getImage(`lesson-step-${Math.min(n, 3)}`) ?? null;
  }
  if (articleId.startsWith("users-")) return getImage("team") ?? null;
  if (articleId.startsWith("settings-") || articleId.startsWith("compliance-")) {
    return getImage("validation") ?? null;
  }
  return getImage(n % 2 === 0 ? "team" : "dashboard") ?? null;
}

const StepCueVisual: React.FC<{ image: ImageRef }> = ({ image }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <figure className="overflow-hidden rounded-brand border border-brand-hairline bg-brand-surface-alt shadow-panel-soft">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${image.alt} full size`}
        className="group relative block w-full cursor-zoom-in bg-brand-surface p-2 transition-[box-shadow,background-color] duration-200 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-primary sm:p-3"
      >
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet}
          sizes={image.sizes ?? "(min-width: 1024px) 560px, 100vw"}
          loading="lazy"
          decoding="async"
          className="block h-auto max-h-[min(70vh,42rem)] w-full object-contain"
        />
        <span className="small absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" /> View
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={image.alt}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full max-w-6xl flex-col items-center gap-3"
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                srcSet={image.srcSet}
                sizes="90vw"
                decoding="async"
                className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-elev-2"
              />
              {image.caption && (
                <figcaption className="body text-center text-white/80">{image.caption}</figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
};

function parseNumberedStepHeading(line: string, level: 3 | 4) {
  const hashes = "#".repeat(level);
  const match = line.match(new RegExp(`^${hashes}\\s+((?:\\d+\\.)*\\d+)\\.?\\s+(.*)$`));
  if (!match) return null;
  return {
    number: match[1],
    title: match[2].trim(),
    nested: match[1].includes("."),
  };
}

function parseStepSectionHeading(line: string) {
  const match = line.match(/^##\s+Step\s+(\d+(?:\.\d+)*)\s*(?::|—|-)\s*(.+)$/i);
  if (!match) return null;
  return {
    number: match[1],
    title: match[2].trim(),
  };
}

/**
 * Articles whose section number should be suppressed because they are
 * reached through a card-based chooser flow (the chooser page itself,
 * any article targeted by its options, and the descendants of those
 * targets). Computed once from the article + chooser registries.
 */
const chooserFlowArticleIds: Set<string> = (() => {
  const ids = new Set<string>();
  const re = /\[chooser-cards:([\w-]+)\]/g;
  for (const page of Object.values(pageContents)) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(page.content)) !== null) {
      ids.add(page.id);
      const chooser = (allChoosers as Record<string, { steps: { options: { next: string }[] }[] }>)[
        m[1]
      ];
      if (!chooser) continue;
      for (const step of chooser.steps) {
        for (const opt of step.options) {
          if (opt.next.startsWith("article:")) {
            ids.add(opt.next.slice("article:".length));
          }
        }
      }
    }
  }
  // Include descendants so sub-articles inherit the suppression.
  let added = true;
  while (added) {
    added = false;
    for (const page of Object.values(pageContents)) {
      if (page.parentArticleId && ids.has(page.parentArticleId) && !ids.has(page.id)) {
        ids.add(page.id);
        added = true;
      }
    }
  }
  return ids;
})();

/**
 * Subscribe to `window.location.hash`. Returns the current hash (including
 * the leading `#`) and re-renders on `hashchange`, plus on the synthetic
 * `lovable:hashchange` event we dispatch from in-app callers (sticky-rail
 * clicks) so the breadcrumb updates instantly even when the hash is set
 * via `history.replaceState` — which does NOT fire `hashchange`.
 */
function useLocationHash(): string {
  const [hash, setHash] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setHash(window.location.hash);
    window.addEventListener("hashchange", sync);
    window.addEventListener("lovable:hashchange", sync as EventListener);
    // Browser back/forward can restore a URL whose hash differs from the
    // one we last observed without firing `hashchange` (e.g. when the
    // intervening history entries only changed search params). `popstate`
    // always fires for back/forward, so re-sync from it as a safety net.
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("lovable:hashchange", sync as EventListener);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  return hash;
}

/**
 * Lightweight extraction of sticky-step metadata from raw article content.
 * Mirrors the parsing in `formatContent` but only captures step numbers and
 * titles so the breadcrumb can resolve a hash like
 * `#<articleId>-sticky-<i>-step-<n>` to a human-readable label without
 * re-rendering the article tree.
 */
function extractStickyStepIndex(
  content: string,
  articleId: string,
): Map<string, { number: string; title: string }> {
  const map = new Map<string, { number: string; title: string }>();
  const re = /\[stickysteps\][ \t]*\n([\s\S]*?)\n\[\/stickysteps\]/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(content)) !== null) {
    const scope = `${articleId}-sticky-${i}`;
    for (const line of m[1].split("\n")) {
      const sm = parseNumberedStepHeading(line, 3);
      if (sm) {
        const number = sm.number;
        const title = sm.title.replace(/[*_`]/g, "").trim();
        map.set(`${scope}-step-${number}`, { number, title });
      }
    }
    i += 1;
  }
  return map;
}

type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  kind?: "section" | "step" | "substep";
};

function getNumberedStepId(number: string, title: string) {
  return slugify(`${number} ${title.replace(/[*_`]/g, "").trim()}`);
}

function extractHeadings(content: string, articleId: string): TocHeading[] {
  const out: TocHeading[] = [];
  let stickyBlockIndex = 0;
  let inStickyBlock = false;

  for (const line of content.split("\n")) {
    if (/^\[stickysteps\]\s*$/.test(line.trim())) {
      inStickyBlock = true;
      continue;
    }
    if (/^\[\/stickysteps\]\s*$/.test(line.trim())) {
      inStickyBlock = false;
      stickyBlockIndex += 1;
      continue;
    }

    if (inStickyBlock) {
      const stepMatch = parseNumberedStepHeading(line, 3);
      if (stepMatch) {
        const title = stepMatch.title.replace(/[*_`]/g, "").trim();
        out.push({
          id: `${articleId}-sticky-${stickyBlockIndex}-step-${stepMatch.number}`,
          text: `${stepMatch.number} ${title}`,
          level: stepMatch.nested ? 4 : 3,
          kind: stepMatch.nested ? "substep" : "step",
        });
      }
      continue;
    }

    if (line.startsWith("#### ")) {
      const stepMatch = parseNumberedStepHeading(line, 4);
      if (stepMatch) {
        const title = stepMatch.title.replace(/[*_`]/g, "").trim();
        out.push({
          id: getNumberedStepId(stepMatch.number, title),
          text: `${stepMatch.number} ${title}`,
          level: 4,
          kind: "substep",
        });
      } else {
        const text = line.replace("#### ", "").trim();
        out.push({ id: slugify(text), text, level: 4 });
      }
      continue;
    }

    if (line.startsWith("### ")) {
      const stepMatch = parseNumberedStepHeading(line, 3);
      if (stepMatch) {
        const title = stepMatch.title.replace(/[*_`]/g, "").trim();
        out.push({
          id: getNumberedStepId(stepMatch.number, title),
          text: `${stepMatch.number} ${title}`,
          level: stepMatch.nested ? 4 : 3,
          kind: stepMatch.nested ? "substep" : "step",
        });
      } else {
        const text = line.replace("### ", "").trim();
        out.push({ id: slugify(text), text, level: 3 });
      }
      continue;
    }

    if (line.startsWith("## ")) {
      const text = line.replace("## ", "").trim();
      const stepMatch = parseStepSectionHeading(line);
      if (stepMatch) {
        const title = stepMatch.title.replace(/[*_`]/g, "").trim();
        out.push({
          id: slugify(text),
          text: `${stepMatch.number} ${title}`,
          level: 2,
          kind: "step",
        });
      } else {
        out.push({ id: slugify(text), text, level: 2, kind: "section" });
      }
    }
  }
  return out;
}

const DEFAULT_VIDEO = "https://www.youtube.com/watch?v=iTssF_NYusQ";

/**
 * Accepts a full YouTube URL (watch, youtu.be, shorts, embed) or a raw 11-char ID
 * and returns the canonical video ID. Returns null if nothing usable is found.
 */
function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => ["embed", "shorts", "v", "live"].includes(p));
      if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    // not a URL — fall through
  }
  const m = s.match(/[a-zA-Z0-9_-]{11}/);
  return m ? m[0] : null;
}

const LazyYouTube: React.FC<{ video: string; title?: string }> = ({ video, title = "Video" }) => {
  const videoId = extractYouTubeId(video);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  // Auto-pause when the iframe scrolls out of view, resume when it returns.
  useEffect(() => {
    if (!loaded) return;
    const el = containerRef.current;
    if (!el) return;
    const send = (func: "pauseVideo" | "playVideo") => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*",
      );
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          send(entry.isIntersecting ? "playVideo" : "pauseVideo");
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  if (!videoId) return null;

  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-brand-hairline bg-secondary/40 shadow-panel-soft"
      style={{ aspectRatio: "16 / 9" }}
    >
      {loaded ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {inView && (
            <img
              src={thumb}
              alt={title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-elev-2 transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-primary">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
};

const ArticleImage: React.FC<{ image: ImageRef }> = ({ image }) => {
  const [open, setOpen] = useState(false);
  const figureRef = useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const isWide = image.presentation === "wide";

  // Start the responsive image request shortly before it enters the viewport.
  useEffect(() => {
    const el = figureRef.current;
    if (!el || nearViewport) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearViewport(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "400px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <figure
      ref={figureRef}
      className={`my-6 mx-auto w-full max-w-3xl ${
        isWide
          ? "xl:mx-0 xl:w-[calc(100%+11rem)] xl:max-w-[calc(100vw-40rem)] 2xl:max-w-[50rem]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${image.alt} full size`}
        className="group relative block w-full overflow-hidden rounded-lg border border-brand-hairline bg-muted/60 shadow-panel-soft ring-1 ring-inset ring-border/40 transition-[box-shadow,border-color] duration-200 hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-primary dark:bg-secondary/30"
      >
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet}
          sizes={
            image.sizes ??
            (isWide
              ? "(min-width: 1280px) 800px, (min-width: 640px) 90vw, 100vw"
              : "(min-width: 1024px) 768px, (min-width: 640px) 90vw, 100vw")
          }
          loading={nearViewport ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={nearViewport ? "high" : "low"}
          className="mx-auto block h-auto max-h-[70vh] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02] sm:max-h-[60vh]"
        />
        <span className="small absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" /> View
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={image.alt}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full max-w-6xl flex-col items-center gap-3"
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                srcSet={image.srcSet}
                sizes="90vw"
                decoding="async"
                className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-elev-2"
              />
              {image.caption && (
                <figcaption className="body text-center text-white/80">{image.caption}</figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
};

const DocumentCard: React.FC<{ doc: DocRef }> = ({ doc }) => {
  const filename = doc.filename ?? doc.href.split("/").pop() ?? "download";
  return (
    <a
      href={doc.href}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Download ${doc.name}${doc.size ? ` (${doc.size})` : ""}`}
      className="group my-4 flex items-center gap-4 rounded-lg border border-brand-hairline bg-secondary/40 p-4 shadow-panel-soft transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/50 hover:bg-secondary/70 hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <IconTile tone="blue" size="md" className="relative">
        <FileText aria-hidden="true" />
        {doc.kind && (
          <span className="absolute -bottom-1 -right-1 rounded bg-primary px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-foreground">
            {doc.kind}
          </span>
        )}
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="h5 block truncate text-foreground">{doc.name}</span>
        {doc.description && (
          <span className="small mt-0.5 block text-muted-foreground">{doc.description}</span>
        )}
        {doc.size && <span className="small mt-1 block text-muted-foreground">{doc.size}</span>}
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Download className="h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  );
};

const navigationHighlightTimers = new WeakMap<HTMLElement, number>();

function highlightNavigatedTarget(id: string, reducedMotion: boolean) {
  const target = document.getElementById(id);
  if (!target) return;
  const highlightTarget = target.matches("h2, h3, h4")
    ? target
    : (target.querySelector<HTMLElement>("h2, h3, h4") ?? target);
  const existingTimer = navigationHighlightTimers.get(highlightTarget);
  if (existingTimer !== undefined) window.clearTimeout(existingTimer);

  window.setTimeout(
    () => {
      if (!highlightTarget.isConnected) return;
      highlightTarget.classList.remove("kb-navigation-target");
      // Restart the cue when the reader selects the same heading twice.
      void highlightTarget.offsetWidth;
      highlightTarget.classList.add("kb-navigation-target");
      const timer = window.setTimeout(
        () => {
          highlightTarget.classList.remove("kb-navigation-target");
          navigationHighlightTimers.delete(highlightTarget);
        },
        reducedMotion ? 900 : 1700,
      );
      navigationHighlightTimers.set(highlightTarget, timer);
    },
    reducedMotion ? 0 : 320,
  );
}

const TableOfContents: React.FC<{
  headings: TocHeading[];
  articleId: string;
  variant?: "rail" | "inline";
  onNavigate?: () => void;
}> = ({ headings, articleId, variant = "rail", onNavigate }) => {
  const reducedMotion = usePrefersReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const activeIdRef = useRef<string | null>(headings[0]?.id ?? null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [inlineOpen, setInlineOpen] = useState(false);
  const isInline = variant === "inline";
  const storageKey = `kb-last-section-v1:${articleId}`;
  const activeHeading = headings.find((heading) => heading.id === activeId);

  useEffect(() => {
    const validIds = new Set(headings.map((h) => h.id));
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    const nextSaved = stored && validIds.has(stored) ? stored : null;
    const hashId = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const nextActiveId = validIds.has(hashId) ? hashId : (headings[0]?.id ?? null);
    setSavedId(nextSaved);
    activeIdRef.current = nextActiveId;
    setActiveId(nextActiveId);
  }, [headings, storageKey]);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const activationLine = 112;
    let frameId: number | null = null;

    const updateActiveHeading = () => {
      frameId = null;
      let nextId = elements[0].id;
      const atPageEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

      if (atPageEnd) {
        nextId = elements[elements.length - 1].id;
      } else {
        for (const element of elements) {
          if (element.getBoundingClientRect().top > activationLine) break;
          nextId = element.id;
        }
      }

      if (activeIdRef.current === nextId) return;
      activeIdRef.current = nextId;
      setActiveId(nextId);
      setSavedId(nextId);
      window.localStorage.setItem(storageKey, nextId);
    };

    const queueUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [headings, storageKey]);

  if (headings.length === 0) return null;

  const navigateToHeading = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    highlightNavigatedTarget(id, reducedMotion);
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new Event("lovable:hashchange"));
    window.localStorage.setItem(storageKey, id);
    activeIdRef.current = id;
    setSavedId(id);
    setActiveId(id);
    if (isInline) setInlineOpen(false);
    onNavigate?.();
  };

  if (isInline) {
    return (
      <Collapsible
        open={inlineOpen}
        onOpenChange={setInlineOpen}
        className="rounded-brand border border-brand-hairline bg-background/95 shadow-panel-soft backdrop-blur-sm transition-shadow data-[state=open]:shadow-panel"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="body flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
            aria-label={
              activeHeading && !inlineOpen
                ? `On this page, current section: ${activeHeading.text}`
                : "On this page"
            }
          >
            <ListTree className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="shrink-0 font-semibold">On this page</span>
            {!inlineOpen && activeHeading && (
              <span className="min-w-0 flex-1 truncate border-l border-brand-hairline pl-3 text-muted-foreground">
                {activeHeading.text}
              </span>
            )}
            <ChevronDown
              className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${
                inlineOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <nav
            aria-label="On this page"
            className="max-h-[min(50vh,28rem)] overflow-y-auto border-t border-brand-hairline p-3 overscroll-contain"
          >
            <ul className="grid gap-1 sm:grid-cols-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    aria-current={activeId === heading.id ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToHeading(heading.id);
                    }}
                    className={`body block rounded-brand px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      activeId === heading.id
                        ? "bg-brand-sky-soft font-medium text-primary"
                        : "text-muted-foreground hover:bg-brand-surface-alt hover:text-foreground"
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <nav aria-label="Table of Contents" className="body">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="h6 text-muted-foreground">Table of Contents</p>
        {savedId && (
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(savedId)
                ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
              highlightNavigatedTarget(savedId, reducedMotion);
              window.history.replaceState(null, "", `#${savedId}`);
              window.dispatchEvent(new Event("lovable:hashchange"));
              activeIdRef.current = savedId;
              setActiveId(savedId);
              onNavigate?.();
            }}
            className="small rounded-full border border-brand-hairline bg-brand-surface px-2.5 py-1 font-medium text-primary transition-colors hover:border-brand-sky/50 hover:bg-brand-sky-soft"
          >
            Resume
          </button>
        )}
      </div>
      <ul className="relative space-y-1 border-l border-brand-hairline">
        {headings.map((h) => {
          const active = activeId === h.id;
          const isStep = h.kind === "step" || h.kind === "substep";
          const isSubstep = h.kind === "substep" || h.level === 4;
          const railIndent = isSubstep ? "pl-8" : h.level === 3 ? "pl-6" : "pl-4";
          return (
            <li key={h.id} className="relative">
              {active && (
                <motion.span
                  layoutId={`toc-active-${variant}`}
                  className="absolute -left-px top-1 bottom-1 w-0.5 rounded-full bg-primary"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
                  }
                />
              )}
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToHeading(h.id);
                }}
                className={`body flex min-h-9 items-start gap-2 rounded-r-md py-1.5 pr-2 leading-snug transition-colors focus:outline-none focus-visible:bg-brand-sky-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 ${railIndent} ${
                  active
                    ? "bg-brand-sky-soft font-medium text-primary"
                    : "text-muted-foreground hover:bg-brand-sky-soft/70 hover:text-foreground"
                }`}
              >
                {isStep && (
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-[10px] font-semibold tabular-nums ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-brand-hairline bg-brand-surface-alt text-muted-foreground"
                    }`}
                  >
                    {h.text.match(/^\d+(?:\.\d+)*/)?.[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  {isStep ? h.text.replace(/^\d+(?:\.\d+)*\s+/, "") : h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

type KbSearch = { q: string; page: string; cats: string[] };

const LAST_VISITED_PAGE_STORAGE_KEY = "kb-last-visited-page-v1";
const RIGHT_TOC_CLOSE_DELAY_MS = 220;
const RIGHT_TOC_HOVER_SUPPRESSION_MS = 700;
const ARTICLE_SEQUENCE = sidebarCategories.flatMap((category) =>
  category.subPages.map((page) => ({
    id: page.id,
    title: page.title,
    categoryName: category.name,
  })),
);
const ARTICLE_INDEX_BY_ID = new Map(ARTICLE_SEQUENCE.map((page, index) => [page.id, index]));

const ease = [0.22, 1, 0.36, 1] as const;
const motionTiming = {
  quick: 0.16,
  standard: 0.22,
};

/**
 * Cache of slideshow image URLs we've already warmed in the browser image
 * cache. Persisted to `sessionStorage` so the warm-set survives full page
 * reloads and same-tab navigation away-and-back — not just unmount/remount.
 * SSR-safe: hydration is lazy on first read in the browser.
 */
const WARMED_STORAGE_KEY = "kb:warmed-slideshow-images:v1";
let warmedSlideshowImages: Set<string> | null = null;

function getWarmedSet(): Set<string> {
  if (warmedSlideshowImages) return warmedSlideshowImages;
  if (typeof window === "undefined") return (warmedSlideshowImages = new Set());
  try {
    const raw = window.sessionStorage.getItem(WARMED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    warmedSlideshowImages = new Set(
      Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [],
    );
  } catch {
    // sessionStorage unavailable (private mode / SSR / blocked) — fall back
    // to an in-memory set; behavior degrades to per-page-load caching.
    warmedSlideshowImages = new Set();
  }
  return warmedSlideshowImages;
}

function rememberWarmed(src: string) {
  const set = getWarmedSet();
  if (set.has(src)) return false;
  set.add(src);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(WARMED_STORAGE_KEY, JSON.stringify([...set]));
    } catch {
      // Quota / disabled — keep the in-memory set; future loads simply
      // re-prefetch.
    }
  }
  return true;
}

/**
 * Reactive `prefers-reduced-motion: reduce` matcher. SSR-safe (returns
 * false until hydration) and updates if the user toggles the OS setting
 * while the page is open.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

const ArticleSlideshow: React.FC<{ slideshow: Slideshow }> = ({ slideshow }) => {
  const total = slideshow.steps.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const clamp = React.useCallback((n: number) => (n + total) % total, [total]);
  const next = React.useCallback(() => setIndex((i) => clamp(i + 1)), [clamp]);
  const prev = React.useCallback(() => setIndex((i) => clamp(i - 1)), [clamp]);

  // Defer all image fetching until the slideshow is near the viewport, then
  // keep `inView` true so prefetching of neighbors can continue as the user
  // navigates. Pauses autoplay when scrolled out.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        setInView((prev) => prev || visible);
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Warm the cache for the current slide and its immediate neighbours so
  // tapping prev / next on mobile feels instant. We use plain `Image()`
  // requests (no `<link rel=prefetch>`) so we don't block the parser and
  // each URL is only fetched once, regardless of how many times the user
  // cycles through.
  useEffect(() => {
    if (!inView || typeof window === "undefined") return;
    const warm = (i: number) => {
      const target = clamp(i);
      const src = slideshow.steps[target].image;
      if (!rememberWarmed(src)) return;
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    };
    warm(index);
    if (total > 1) {
      warm(index + 1);
      warm(index - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, index, total]);

  // Autoplay — only when in view, not in lightbox, and the user has not
  // requested reduced motion.
  useEffect(() => {
    if (!playing || lightboxOpen || !inView || reducedMotion) return;
    const id = window.setInterval(() => setIndex((i) => clamp(i + 1)), 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, total, lightboxOpen, inView, reducedMotion]);

  // If reduced-motion turns on mid-session, stop any active auto-play.
  useEffect(() => {
    if (reducedMotion && playing) setPlaying(false);
  }, [reducedMotion, playing]);

  // Keyboard nav when the component (or lightbox) has focus / is mounted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = containerRef.current;
      const focused =
        lightboxOpen ||
        (el && (el === document.activeElement || el.contains(document.activeElement)));
      if (!focused) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  const step = slideshow.steps[index];

  return (
    <figure className="my-8">
      {slideshow.title && <p className="h6 mb-3 text-muted-foreground">{slideshow.title}</p>}
      <div
        ref={containerRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={slideshow.title ?? "Image slideshow"}
        className="relative overflow-hidden rounded-brand-lg border border-brand-hairline bg-secondary/40 shadow-panel-soft focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="relative" style={{ aspectRatio: "16 / 10" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={index}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Open step ${index + 1}: ${step.title} full size`}
              initial={reducedMotion ? false : { opacity: 0, scale: 1.02 }}
              animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
              className="absolute inset-0 h-full w-full"
            >
              {inView ? (
                <img
                  src={step.image}
                  alt={step.alt}
                  loading="lazy"
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="block h-full w-full bg-gradient-to-br from-secondary to-muted"
                />
              )}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            </motion.button>
          </AnimatePresence>

          {/* Step badge */}
          <span className="h6 absolute left-4 top-4 rounded-full bg-primary/95 px-3 py-1 text-primary-foreground shadow-elev-1">
            {step.label}
          </span>

          {/* Caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
              >
                <h4 className="h3 drop-shadow">{step.title}</h4>
                <p className="body mt-1 max-w-2xl text-white/90 drop-shadow">{step.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / Next */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous step"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-elev-1 backdrop-blur transition hover:bg-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next step"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-elev-1 backdrop-blur transition hover:bg-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-3 border-t border-brand-hairline bg-card/80 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={
              reducedMotion
                ? "Auto-play disabled by reduced-motion preference"
                : playing
                  ? "Pause slideshow"
                  : "Play slideshow"
            }
            disabled={reducedMotion}
            title={
              reducedMotion
                ? "Auto-play is disabled because you've requested reduced motion."
                : undefined
            }
            className="small flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Auto-play"}
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Slideshow steps">
            {slideshow.steps.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to ${s.label}: ${s.title}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-150 ${
                    active
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  } ${reducedMotion ? "!transition-none" : ""}`}
                />
              );
            })}
          </div>

          <span className="small tabular-nums text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={step.alt}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous step"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next step"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.figure
              key={index}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full max-w-6xl flex-col items-center gap-3"
            >
              <img
                src={step.image}
                alt={step.alt}
                className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-elev-2"
              />
              <figcaption className="body text-center text-white/90">
                <span className="font-semibold">{step.title}</span>
                <span className="mx-2 text-white/40">•</span>
                <span className="text-white/70">
                  {index + 1} / {total}
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
};

const ArticleQuiz: React.FC<{ quiz: Quiz }> = ({ quiz }) => {
  const total = quiz.questions.length;
  const reducedMotion = usePrefersReducedMotion();

  // Per-quiz storage keys (scoped to the quiz title so multiple quizzes
  // on different articles don't collide).
  const quizKey = quiz.title ?? "quiz";
  const historyKey = `kb-quiz-history:${quizKey}`;
  const progressKey = `kb-quiz-progress:${quizKey}`;

  // Load any in-progress attempt saved in this tab. We don't auto-resume —
  // we surface a Resume / Start over prompt so the user is in control.
  type Progress = { index: number; selected: number | null; results: boolean[] };
  const savedProgress = React.useMemo<Progress | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(progressKey);
      if (!raw) return null;
      const p = JSON.parse(raw) as Progress;
      // Validate shape against the current quiz before trusting it.
      if (
        typeof p?.index !== "number" ||
        p.index < 0 ||
        p.index >= total ||
        !Array.isArray(p.results) ||
        p.results.length > total
      ) {
        return null;
      }
      return p;
    } catch {
      return null;
    }
    // Only read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // Per-question correctness, in order, used for the final score recap.
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [resumePromptOpen, setResumePromptOpen] = useState(savedProgress !== null);

  // Persist past attempts per quiz across reloads / navigation within the tab.
  const [history, setHistory] = useState<{ score: number; total: number; at: number }[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(historyKey);
      return raw ? (JSON.parse(raw) as { score: number; total: number; at: number }[]) : [];
    } catch {
      return [];
    }
  });
  const attemptRecordedRef = React.useRef(false);

  const question = quiz.questions[index];
  const correctIndex = useMemo(() => question.options.findIndex((o) => o.correct), [question]);
  const answered = selected !== null;
  const isCorrect = answered && selected === correctIndex;
  const score = results.filter(Boolean).length;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setResults((r) => [...r, i === correctIndex]);
  };

  const goNext = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    attemptRecordedRef.current = false;
    setIndex(0);
    setSelected(null);
    setResults([]);
    setFinished(false);
    setResumePromptOpen(false);
    try {
      window.sessionStorage.removeItem(progressKey);
    } catch {
      /* ignore */
    }
  };

  const resume = () => {
    if (!savedProgress) {
      setResumePromptOpen(false);
      return;
    }
    setIndex(savedProgress.index);
    setSelected(savedProgress.selected);
    setResults(savedProgress.results);
    setFinished(false);
    setResumePromptOpen(false);
  };

  // Persist live progress to sessionStorage so a refresh can resume.
  // Skip while the resume prompt is up (we haven't decided yet) and clear
  // once the attempt is finished/recorded.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (resumePromptOpen) return;
    try {
      if (finished) {
        window.sessionStorage.removeItem(progressKey);
        return;
      }
      // Don't persist a pristine, untouched attempt.
      if (index === 0 && selected === null && results.length === 0) {
        window.sessionStorage.removeItem(progressKey);
        return;
      }
      const payload: Progress = { index, selected, results };
      window.sessionStorage.setItem(progressKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [index, selected, results, finished, resumePromptOpen, progressKey]);

  // Record an attempt once when the user reaches the recap screen.
  React.useEffect(() => {
    if (!finished || attemptRecordedRef.current) return;
    attemptRecordedRef.current = true;
    const entry = { score, total, at: Date.now() };
    setHistory((h) => {
      const next = [...h, entry].slice(-10);
      try {
        window.sessionStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        /* ignore quota / disabled storage */
      }
      return next;
    });
  }, [finished, score, total, historyKey]);

  const clearHistory = () => {
    setHistory([]);
    try {
      window.sessionStorage.removeItem(historyKey);
    } catch {
      /* ignore */
    }
  };

  return (
    <figure className="my-8">
      {quiz.title && <p className="h6 mb-3 text-muted-foreground">{quiz.title}</p>}
      <div className={cardVariants({ variant: "elevated", className: "overflow-hidden" })}>
        {/* Progress bar */}
        <div className="h-1 w-full bg-secondary">
          <div
            className={`h-full bg-primary ${reducedMotion ? "" : "transition-[width] duration-500 ease-out"}`}
            style={{
              width: `${(((finished ? total : index) + (answered && !finished ? 1 : 0)) / total) * 100}%`,
            }}
          />
        </div>

        {resumePromptOpen && savedProgress ? (
          <div className="p-6 sm:p-8 text-center">
            <IconTile tone="blue" size="lg" className="mx-auto mb-4">
              <RotateCcw />
            </IconTile>
            <h4 className="h3 text-foreground">Resume where you left off?</h4>
            <p className="body mx-auto mt-2 max-w-md text-muted-foreground">
              You were on question {savedProgress.index + 1} of {total}
              {savedProgress.results.length > 0 && (
                <> with {savedProgress.results.filter(Boolean).length} correct so far</>
              )}
              .
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={resume} size="sm">
                Resume
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={restart} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4" /> Start over
              </Button>
            </div>
          </div>
        ) : finished ? (
          <div className="p-6 sm:p-8 text-center">
            <IconTile tone="blue" size="lg" className="mx-auto mb-4">
              <Trophy />
            </IconTile>
            <h4 className="h3 text-foreground">
              You scored {score} / {total}
            </h4>
            <p className="body mx-auto mt-2 max-w-md text-muted-foreground">
              {score === total
                ? "Perfect run — you've clearly been reading the how-to's."
                : score >= Math.ceil(total / 2)
                  ? "Solid effort. Revisit the linked guides for anything you missed."
                  : "Take another lap through the how-to's and try again — every link in the explanations goes straight to the source."}
            </p>
            <ul className="mx-auto mt-5 grid max-w-md gap-1.5 text-left">
              {quiz.questions.map((q, i) => (
                <li
                  key={i}
                  className="body flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  {results[i] ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{q.label}.</span> {q.prompt}
                  </span>
                </li>
              ))}
            </ul>
            <Button onClick={restart} className="mt-6" variant="outline">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>

            {history.length > 0 && (
              <div className="mx-auto mt-6 max-w-md text-left">
                <div className="mb-2 flex items-center justify-between">
                  <p className="h6 text-muted-foreground">Score history</p>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="small font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <ol className="flex flex-col gap-1">
                  {history
                    .slice()
                    .reverse()
                    .map((h, i) => {
                      const attemptNo = history.length - i;
                      const pct = Math.round((h.score / h.total) * 100);
                      const isLatest = i === 0;
                      return (
                        <li
                          key={`${h.at}-${i}`}
                          className={`body flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 tabular-nums ${
                            isLatest
                              ? "bg-primary/10 text-foreground"
                              : "bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          <span className="font-medium">
                            Attempt {attemptNo}
                            {isLatest && (
                              <span className="small ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 font-semibold uppercase text-primary">
                                Latest
                              </span>
                            )}
                          </span>
                          <span>
                            {h.score} / {h.total}
                            <span className="small ml-2 text-muted-foreground">({pct}%)</span>
                          </span>
                        </li>
                      );
                    })}
                </ol>
                {history.length > 1 && (
                  <p className="small mt-2 text-muted-foreground">
                    Best: {Math.max(...history.map((h) => h.score))} / {total}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-0 sm:grid-cols-[1fr_1.2fr]">
            {/* Image side */}
            {question.image ? (
              <div className="relative min-h-[200px] bg-secondary/40 sm:min-h-full">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={index}
                    src={question.image}
                    alt={question.alt ?? ""}
                    loading="lazy"
                    decoding="async"
                    initial={reducedMotion ? false : { opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                    transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <span className="h6 absolute left-3 top-3 rounded-full bg-primary/95 px-3 py-1 text-primary-foreground shadow-elev-1">
                  {question.label}
                </span>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Question side */}
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              {!question.image && (
                <span className="h6 self-start rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {question.label}
                </span>
              )}
              {index === 0 && quiz.intro && (
                <p className="small text-muted-foreground">{quiz.intro}</p>
              )}
              <h4 className="h3 text-foreground">{question.prompt}</h4>

              <ul className="flex flex-col gap-2" role="radiogroup" aria-label={question.prompt}>
                {question.options.map((opt, i) => {
                  const isPicked = selected === i;
                  const isAnswerCorrect = i === correctIndex;
                  let cls =
                    "border-brand-hairline bg-background hover:border-primary/60 hover:bg-accent";
                  if (answered) {
                    if (isAnswerCorrect) {
                      cls = "border-success/60 bg-success/10 text-foreground";
                    } else if (isPicked) {
                      cls = "border-destructive/60 bg-destructive/10 text-foreground";
                    } else {
                      cls = "border-border/40 bg-background opacity-70";
                    }
                  }
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        disabled={answered}
                        onClick={() => choose(i)}
                        className={`body flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-default ${cls}`}
                      >
                        <span>{opt.label}</span>
                        {answered && isAnswerCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        )}
                        {answered && isPicked && !isAnswerCorrect && (
                          <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <AnimatePresence initial={false}>
                {answered && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: reducedMotion ? 0 : motionTiming.quick, ease }}
                    className={`body rounded-lg border px-4 py-3 ${
                      isCorrect
                        ? "border-success/30 bg-success/5 text-foreground"
                        : "border-destructive/30 bg-destructive/5 text-foreground"
                    }`}
                  >
                    <p className="h6 mb-1">{isCorrect ? "Correct" : "Not quite"}</p>
                    <p className="text-muted-foreground">
                      {renderInlineMarkdown(question.explanation, [], { n: 0 })}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="small tabular-nums text-muted-foreground">
                  {index + 1} / {total}
                </span>
                <Button onClick={goNext} disabled={!answered} size="sm">
                  {index + 1 === total ? "See results" : "Next question"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
};

function formatContent(
  content: string,
  title?: string,
  tokens: string[] = [],
  articleId: string = title ?? "kb",
) {
  const counter = { n: 0 };
  const renderCalloutBody = (text: string) => {
    const paragraphs = splitCalloutParagraphs(text);
    return paragraphs.map((segments, p) => (
      <p key={p}>
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {renderInlineMarkdown(seg, tokens, counter)}
          </React.Fragment>
        ))}
      </p>
    ));
  };
  // Pre-extract collapsible blocks: `[details] Summary\n…body…\n[/details]`.
  // Body markdown is stashed by index so we can recursively render it.
  const detailsBlocks: { summary: string; body: string }[] = [];
  // Pre-extract sticky-step blocks: `[stickysteps]\n…\n[/stickysteps]` —
  // inside, every `### N. Title` line opens a new step and its body runs
  // until the next step heading or the end of the block.
  const stickyBlocks: { steps: StickyStep[] }[] = [];
  let preprocessed = consolidateCallouts(content).replace(
    /\[details\][ \t]*([^\n]+)\n([\s\S]*?)\n\[\/details\]/g,
    (_m, summary: string, body: string) => {
      const i = detailsBlocks.length;
      detailsBlocks.push({ summary: summary.trim(), body });
      return `[details:${i}]`;
    },
  );
  preprocessed = preprocessed.replace(
    /\[stickysteps\][ \t]*\n([\s\S]*?)\n\[\/stickysteps\]/g,
    (_m, body: string) => {
      const steps: StickyStep[] = [];
      const lines = body.split("\n");
      let current: { number: string; title: string; buf: string[] } | null = null;
      const flush = () => {
        if (!current) return;
        const stepBody = current.buf.join("\n").trim();
        const titleText = current.title.replace(/[*_`]/g, "").trim();
        steps.push({
          number: current.number,
          title: current.title,
          titleText,
          body: formatContent(stepBody, title, tokens, articleId),
        });
        current = null;
      };
      for (const raw of lines) {
        const m = parseNumberedStepHeading(raw, 3);
        if (m) {
          flush();
          current = { number: m.number, title: m.title, buf: [] };
        } else if (current) {
          current.buf.push(raw);
        }
        // Lines before the first step heading are ignored — keep step blocks tight.
      }
      flush();
      const i = stickyBlocks.length;
      stickyBlocks.push({ steps });
      return `[stickysteps:${i}]`;
    },
  );
  let activeNestedStep = false;
  let actionVisualIndex = 0;
  let activeVisualIndex = 0;
  const nestedStepContentClass = "ml-4 sm:ml-16";
  const nestedStepListClass = "ml-10 sm:ml-[5.5rem]";
  return preprocessed.split("\n").map((line, index) => {
    const stickyMatch = line.trim().match(/^\[stickysteps:(\d+)\]$/);
    if (stickyMatch) {
      const block = stickyBlocks[Number(stickyMatch[1])];
      if (!block) return null;
      return (
        <KbStickySteps
          key={index}
          scopeId={`${articleId}-sticky-${stickyMatch[1]}`}
          steps={block.steps}
        />
      );
    }
    const detailsMatch = line.trim().match(/^\[details:(\d+)\]$/);
    if (detailsMatch) {
      const block = detailsBlocks[Number(detailsMatch[1])];
      if (!block) return null;
      return (
        <KbDetails
          key={index}
          articleId={articleId}
          summary={renderInlineMarkdown(block.summary, tokens, counter)}
          summaryText={block.summary}
        >
          {formatContent(block.body, title, tokens, articleId)}
        </KbDetails>
      );
    }
    // Callout token on its own line: `> [!NOTE] text` or `> [!WARNING] text`.
    const callout = parseCallout(line);
    if (callout) {
      return (
        <KbCallout key={index} kind={callout.kind}>
          {renderCalloutBody(callout.text)}
        </KbCallout>
      );
    }
    // Registry callout token: [note:key] / [warn:key] / [warning:key].
    // Optionally override the registry text inline (single or multi-line):
    //   [note:key]: My custom description
    //   continued on the next line until a blank line or new block
    const calloutRefMatch = line.trim().match(/^\[(note|warn|warning):([\w-]+)\](?::\s*(.+))?$/is);
    if (calloutRefMatch) {
      const key = calloutRefMatch[2];
      const override = calloutRefMatch[3]?.trim();
      const ref = getCallout(key);
      if (!ref) {
        return (
          <p key={index} className="body text-destructive">
            Unknown callout reference: {key}
          </p>
        );
      }
      const text = override && override.length > 0 ? override : ref.text;
      return (
        <KbCallout key={index} kind={ref.kind}>
          {renderCalloutBody(text)}
        </KbCallout>
      );
    }
    // Inline video token: [video:key] on its own line.
    const videoMatch = line.trim().match(/^\[video:([\w-]+)\]$/);
    if (videoMatch) {
      const url = getVideo(videoMatch[1]);
      if (!url) {
        return (
          <p key={index} className="body text-destructive">
            Unknown video reference: {videoMatch[1]}
          </p>
        );
      }
      return (
        <div key={index} className="my-6">
          <LazyYouTube video={url} title={`${title ?? "Video"} — ${videoMatch[1]}`} />
        </div>
      );
    }
    // Inline image token: [image:key] on its own line.
    const imageMatch = line.trim().match(/^\[image:([\w-]+)\]$/);
    if (imageMatch) {
      const img = getImage(imageMatch[1]);
      if (!img) {
        return (
          <p key={index} className="body text-destructive">
            Unknown image reference: {imageMatch[1]}
          </p>
        );
      }
      return <ArticleImage key={index} image={img} />;
    }
    // Inline document token: [doc:key] on its own line.
    const docMatch = line.trim().match(/^\[doc:([\w-]+)\]$/);
    if (docMatch) {
      const doc = getDocument(docMatch[1]);
      if (!doc) {
        return (
          <p key={index} className="body text-destructive">
            Unknown document reference: {docMatch[1]}
          </p>
        );
      }
      return <DocumentCard key={index} doc={doc} />;
    }
    // Inline slideshow token: [slideshow:key] on its own line.
    const slideshowMatch = line.trim().match(/^\[slideshow:([\w-]+)\]$/);
    if (slideshowMatch) {
      const show = getSlideshow(slideshowMatch[1]);
      if (!show) {
        return (
          <p key={index} className="body text-destructive">
            Unknown slideshow reference: {slideshowMatch[1]}
          </p>
        );
      }
      return show.variant === "immersive" ? (
        <ImmersiveSlideshow key={index} slideshow={show} />
      ) : (
        <ArticleSlideshow key={index} slideshow={show} />
      );
    }
    // Inline quiz token: [quiz:key] on its own line.
    const quizMatch = line.trim().match(/^\[quiz:([\w-]+)\]$/);
    if (quizMatch) {
      const quiz = getQuiz(quizMatch[1]);
      if (!quiz) {
        return (
          <p key={index} className="body text-destructive">
            Unknown quiz reference: {quizMatch[1]}
          </p>
        );
      }
      return <ArticleQuiz key={index} quiz={quiz} />;
    }
    // Inline chooser token: [chooser:key] on its own line.
    const chooserMatch = line.trim().match(/^\[chooser:([\w-]+)\]$/);
    if (chooserMatch) {
      const chooser = getChooser(chooserMatch[1]);
      if (!chooser) {
        return (
          <p key={index} className="body text-destructive">
            Unknown chooser reference: {chooserMatch[1]}
          </p>
        );
      }
      return (
        <KbChooser
          key={index}
          chooser={chooser}
          scopeId={`${articleId}-chooser-${chooserMatch[1]}`}
        />
      );
    }
    // Card-grid chooser token: [chooser-cards:key] on its own line.
    // Used for dedicated chooser pages — renders all options as cards
    // that link straight to the recommended article.
    const chooserCardsMatch = line.trim().match(/^\[chooser-cards:([\w-]+)\]$/);
    if (chooserCardsMatch) {
      const chooser = getChooser(chooserCardsMatch[1]);
      if (!chooser) {
        return (
          <p key={index} className="body text-destructive">
            Unknown chooser reference: {chooserCardsMatch[1]}
          </p>
        );
      }
      return <KbChooserCards key={index} chooser={chooser} />;
    }
    if (line.startsWith("## ")) {
      activeNestedStep = false;
      const headingText = line.replace("## ", "");
      const id = slugify(headingText);
      const stepMatch = parseStepSectionHeading(line);
      if (stepMatch) {
        return (
          <h2
            key={index}
            id={id}
            className="relative mt-14 mb-5 flex items-start gap-4 scroll-mt-24 text-foreground"
          >
            <span
              aria-hidden="true"
              className="absolute left-[17px] top-9 bottom-[-2rem] w-px bg-border"
            />
            <span
              aria-hidden="true"
              className="small relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold tabular-nums text-primary-foreground shadow-elev-1"
            >
              {stepMatch.number}
            </span>
            <span className="h3 pt-1 text-foreground">
              <span className="sr-only">Step {stepMatch.number}: </span>
              {renderInlineMarkdown(stepMatch.title, tokens, counter)}
            </span>
          </h2>
        );
      }
      return (
        <h2 key={index} id={id} className="h2 mt-14 mb-5 scroll-mt-24 text-foreground">
          {renderInlineMarkdown(headingText, tokens, counter)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      const stepMatch = parseNumberedStepHeading(line, 3);
      if (stepMatch) {
        const n = stepMatch.number;
        const rest = stepMatch.title;
        if (stepMatch.nested) {
          activeNestedStep = true;
          const id = getNumberedStepId(n, rest);
          return (
            <h3
              key={index}
              id={id}
              className="relative mt-7 mb-4 ml-4 flex items-start gap-4 scroll-mt-24 rounded-brand border border-brand-hairline bg-brand-surface px-4 py-3 shadow-panel-soft"
            >
              <span className="small mt-0.5 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-2 font-semibold tabular-nums text-primary shadow-elev-inset">
                {n}
              </span>
              <span className="h5 pt-0.5 text-foreground">
                {renderInlineMarkdown(rest, tokens, counter)}
              </span>
            </h3>
          );
        }
        activeNestedStep = false;
        const id = getNumberedStepId(n, rest);
        return (
          <h3
            key={index}
            id={id}
            className="relative mt-10 mb-5 flex items-start gap-5 scroll-mt-24"
          >
            <span
              aria-hidden="true"
              className="absolute left-[15px] top-8 bottom-[-1.75rem] w-px bg-border"
            />
            <span className="h5 relative z-10 flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-primary-foreground shadow-elev-1">
              {n}
            </span>
            <span className="h3 pt-1 text-foreground">
              {renderInlineMarkdown(rest, tokens, counter)}
            </span>
          </h3>
        );
      }
      activeNestedStep = false;
      const headingText = line.replace("### ", "");
      const id = slugify(headingText);
      return (
        <h3 key={index} id={id} className="h3 mt-9 mb-3 scroll-mt-24 text-foreground">
          {renderInlineMarkdown(headingText, tokens, counter)}
        </h3>
      );
    }
    if (line.startsWith("#### ")) {
      const stepMatch = parseNumberedStepHeading(line, 4);
      if (stepMatch) {
        activeNestedStep = true;
        const id = getNumberedStepId(stepMatch.number, stepMatch.title);
        return (
          <h4
            key={index}
            id={id}
            className="relative mt-7 mb-4 ml-4 flex items-start gap-4 scroll-mt-24 rounded-brand border border-brand-hairline bg-brand-surface px-4 py-3 shadow-panel-soft"
          >
            <span className="small mt-0.5 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 px-2 font-semibold tabular-nums text-primary shadow-elev-inset">
              {stepMatch.number}
            </span>
            <span className="h5 pt-0.5 text-foreground">
              {renderInlineMarkdown(stepMatch.title, tokens, counter)}
            </span>
          </h4>
        );
      }
      activeNestedStep = false;
      const headingText = line.replace("#### ", "");
      const id = slugify(headingText);
      return (
        <h4 key={index} id={id} className="h4 mt-8 mb-3 scroll-mt-24 text-foreground">
          {renderInlineMarkdown(headingText, tokens, counter)}
        </h4>
      );
    }
    if (line.trim() === "---") {
      activeNestedStep = false;
      return <hr key={index} className="my-10 border-brand-hairline" />;
    }
    const stepCue = parseStepCue(line);
    if (stepCue) {
      if (stepCue.key === "note") return null;
      if (stepCue.key === "action") {
        actionVisualIndex += 1;
        activeVisualIndex = actionVisualIndex;
      }
      const visualIndex = activeVisualIndex || actionVisualIndex || 1;
      const supportsVisual = ["action", "expected outcome", "outcome"].includes(stepCue.key);
      const visual = supportsVisual
        ? stepCue.imageKey
          ? (getImage(stepCue.imageKey) ?? null)
          : getStepCueImage(articleId, visualIndex, stepCue.key)
        : null;
      const unknownImageKey =
        supportsVisual && stepCue.imageKey && !visual ? stepCue.imageKey : null;
      return (
        <div
          key={index}
          className={
            activeNestedStep
              ? `kb-step-cue my-4 grid gap-3 border-l-2 border-brand-hairline py-3 pl-4 sm:grid-cols-[11rem_minmax(0,1fr)] ${nestedStepContentClass}`
              : "kb-step-cue my-4 grid gap-3 border-l-2 border-brand-hairline py-3 pl-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
          }
        >
          <span
            className={`h6 inline-flex w-fit items-center self-start whitespace-nowrap rounded-full border px-2 py-1 ${stepCue.style.className}`}
          >
            {stepCue.style.label}
          </span>
          <div className="min-w-0 self-center">
            <p className="body m-0 text-foreground">
              {renderInlineMarkdown(stepCue.text, tokens, counter)}
            </p>
          </div>
          {visual && (
            <div className="min-w-0 sm:col-span-2">
              <StepCueVisual image={visual} />
            </div>
          )}
          {unknownImageKey && (
            <p className="body m-0 text-destructive sm:col-span-2">
              Unknown image reference: {unknownImageKey}
            </p>
          )}
        </div>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li
          key={index}
          className={`body mb-2 list-disc text-foreground/85 ${
            activeNestedStep ? nestedStepListClass : "ml-6"
          }`}
        >
          {renderInlineMarkdown(line.replace("- ", ""), tokens, counter)}
        </li>
      );
    }
    if (line.trim() === "") return <div key={index} className="h-3" />;
    return (
      <p
        key={index}
        className={
          activeNestedStep
            ? `body mb-4 text-foreground/85 ${nestedStepContentClass}`
            : "body mb-4 text-foreground/85"
        }
      >
        {renderInlineMarkdown(line, tokens, counter)}
      </p>
    );
  });
}

export function FormattedArticleContent({
  content,
  title,
  tokens = [],
  articleId,
}: {
  content: string;
  title?: string;
  tokens?: string[];
  articleId?: string;
}) {
  return <>{formatContent(content, title, tokens, articleId)}</>;
}

export const KnowledgeBase: React.FC = () => {
  const routeApi = getRouteApi("/");
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: "/" });

  const isHome = search.page === "";
  const selectedPageId = search.page || DEFAULT_PAGE_ID;

  // Local input value so typing stays snappy; URL updates are debounced.
  const [searchQuery, setSearchQuery] = useState(search.q);
  // Bumped on sidebar result clicks to re-trigger the scroll-to-match effect,
  // even when the clicked page is already the selected one.
  const [scrollTick, setScrollTick] = useState(0);
  useEffect(() => {
    setSearchQuery(search.q);
  }, [search.q]);
  useEffect(() => {
    if (searchQuery === search.q) return;
    const id = setTimeout(() => {
      navigate({
        search: (prev: KbSearch) => ({ ...prev, q: searchQuery }),
        replace: true,
      });
    }, 200);
    return () => clearTimeout(id);
  }, [searchQuery, search.q, navigate]);

  const { theme, toggleTheme, mounted } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const scrollBehavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
  const [contactOpen, setContactOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpfulResponse, setHelpfulResponse] = useState<"yes" | "no" | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rightTocOpen, setRightTocOpen] = useState(false);
  const [continuePageId, setContinuePageId] = useState<string | null>(null);
  const rightTocButtonRef = useRef<HTMLButtonElement | null>(null);
  const rightTocCloseTimerRef = useRef<number | null>(null);
  const rightTocSuppressionTimerRef = useRef<number | null>(null);
  const suppressRightTocHoverRef = useRef(false);
  const previousPageIdRef = useRef(search.page);
  const suppressNextContinueRef = useRef(false);
  const copyResetTimerRef = useRef<number | null>(null);
  // Defer platform sniff to post-hydration to avoid SSR/CSR mismatch.
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    if (isHome) {
      try {
        const storedPageId = window.localStorage.getItem(LAST_VISITED_PAGE_STORAGE_KEY);
        if (storedPageId && pageContents[storedPageId]) {
          setContinuePageId(storedPageId);
        }
      } catch {
        /* ignore unavailable storage */
      }
      previousPageIdRef.current = "";
      return;
    }

    const previousPageId = previousPageIdRef.current;
    try {
      if (previousPageId === selectedPageId) {
        const storedPageId = window.localStorage.getItem(LAST_VISITED_PAGE_STORAGE_KEY);
        if (storedPageId && storedPageId !== selectedPageId && pageContents[storedPageId]) {
          setContinuePageId(storedPageId);
        }
      } else if (suppressNextContinueRef.current) {
        suppressNextContinueRef.current = false;
      } else if (pageContents[previousPageId]) {
        setContinuePageId(previousPageId);
      }
      window.localStorage.setItem(LAST_VISITED_PAGE_STORAGE_KEY, selectedPageId);
    } catch {
      /* ignore unavailable storage */
    }
    previousPageIdRef.current = selectedPageId;
  }, [isHome, selectedPageId]);

  useEffect(() => {
    if (isHome) return;

    const revealActiveArticle = () => {
      document.querySelectorAll<HTMLElement>("[data-kb-sidebar-scroll]").forEach((container) => {
        if (container.clientHeight === 0) return;
        const activeItem = container.querySelector<HTMLElement>('[aria-current="page"]');
        if (!activeItem) return;

        const containerRect = container.getBoundingClientRect();
        const activeRect = activeItem.getBoundingClientRect();
        const edgeMargin = Math.min(72, container.clientHeight * 0.2);
        const comfortablyVisible =
          activeRect.top >= containerRect.top + edgeMargin &&
          activeRect.bottom <= containerRect.bottom - edgeMargin;
        if (comfortablyVisible) return;

        const activeCenter = activeRect.top + activeRect.height / 2;
        const containerCenter = containerRect.top + containerRect.height / 2;
        const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
        const nextScrollTop = Math.min(
          maxScrollTop,
          Math.max(0, container.scrollTop + activeCenter - containerCenter),
        );
        container.scrollTo({ top: nextScrollTop, behavior: scrollBehavior });
      });
    };

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(revealActiveArticle);
    });
    const drawerRetry = sidebarOpen
      ? window.setTimeout(revealActiveArticle, motionTiming.standard * 1000)
      : null;
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      if (drawerRetry !== null) window.clearTimeout(drawerRetry);
    };
  }, [isHome, scrollBehavior, selectedPageId, sidebarOpen]);

  const clearRightTocCloseTimer = React.useCallback(() => {
    if (rightTocCloseTimerRef.current === null) return;
    window.clearTimeout(rightTocCloseTimerRef.current);
    rightTocCloseTimerRef.current = null;
  }, []);

  const clearRightTocSuppressionTimer = React.useCallback(() => {
    if (rightTocSuppressionTimerRef.current === null) return;
    window.clearTimeout(rightTocSuppressionTimerRef.current);
    rightTocSuppressionTimerRef.current = null;
  }, []);

  const suppressRightTocHoverTemporarily = React.useCallback(() => {
    clearRightTocSuppressionTimer();
    suppressRightTocHoverRef.current = true;
    rightTocSuppressionTimerRef.current = window.setTimeout(() => {
      suppressRightTocHoverRef.current = false;
      rightTocSuppressionTimerRef.current = null;
    }, RIGHT_TOC_HOVER_SUPPRESSION_MS);
  }, [clearRightTocSuppressionTimer]);

  const openRightTocFromHoverOrFocus = React.useCallback(() => {
    clearRightTocCloseTimer();
    if (!suppressRightTocHoverRef.current) setRightTocOpen(true);
  }, [clearRightTocCloseTimer]);

  const scheduleRightTocClose = React.useCallback(() => {
    clearRightTocCloseTimer();
    rightTocCloseTimerRef.current = window.setTimeout(
      () => {
        setRightTocOpen(false);
        rightTocCloseTimerRef.current = null;
      },
      reducedMotion ? 0 : RIGHT_TOC_CLOSE_DELAY_MS,
    );
  }, [clearRightTocCloseTimer, reducedMotion]);

  const closeRightTocAfterNavigation = React.useCallback(() => {
    clearRightTocCloseTimer();
    suppressRightTocHoverTemporarily();
    setRightTocOpen(false);
  }, [clearRightTocCloseTimer, suppressRightTocHoverTemporarily]);

  const toggleRightToc = React.useCallback(() => {
    clearRightTocCloseTimer();
    if (rightTocOpen) {
      suppressRightTocHoverTemporarily();
      setRightTocOpen(false);
      return;
    }
    clearRightTocSuppressionTimer();
    suppressRightTocHoverRef.current = false;
    setRightTocOpen(true);
  }, [
    clearRightTocCloseTimer,
    clearRightTocSuppressionTimer,
    rightTocOpen,
    suppressRightTocHoverTemporarily,
  ]);

  useEffect(
    () => () => {
      clearRightTocCloseTimer();
      clearRightTocSuppressionTimer();
    },
    [clearRightTocCloseTimer, clearRightTocSuppressionTimer],
  );

  // Cmd/Ctrl+K and "/" open the single documentation search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "/" && !isTyping) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectPage = (pageId: string) =>
    navigate({
      search: (prev: KbSearch) => ({ ...prev, page: pageId }),
      replace: false,
    });

  const goHome = () => {
    setRightTocOpen(false);
    navigate({
      search: (prev: KbSearch) => ({ ...prev, q: "", page: "" }),
      replace: false,
    });
  };

  // Sidebar result click: navigate AND request a scroll to the first match.
  const selectPageAndScroll = (pageId: string) => {
    selectPage(pageId);
    setScrollTick((n) => n + 1);
  };

  const currentPage = pageContents[selectedPageId] ?? pageContents[DEFAULT_PAGE_ID];
  const currentArticleIndex = ARTICLE_INDEX_BY_ID.get(currentPage.id) ?? -1;
  const previousArticle =
    currentArticleIndex > 0 ? ARTICLE_SEQUENCE[currentArticleIndex - 1] : null;
  const nextArticle =
    currentArticleIndex >= 0 && currentArticleIndex < ARTICLE_SEQUENCE.length - 1
      ? ARTICLE_SEQUENCE[currentArticleIndex + 1]
      : null;
  const hasStepsSection = /^##\s+Steps\s*$/m.test(currentPage.content);
  const articleHeadings = useMemo(
    () => extractHeadings(currentPage.content, currentPage.id),
    [currentPage.content, currentPage.id],
  );
  const scrollToSteps = () => {
    document.getElementById("steps")?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
  };
  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      toast.success("Article link copied", {
        description: "The current guide is ready to share.",
      });
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => setLinkCopied(false), 2400);
    } catch {
      toast.error("Couldn’t copy the article link", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  // Re-render the breadcrumb on every hash change (browser back/forward,
  // sticky-rail clicks, deep links) so the active step segment is always
  // in sync with what the reader is looking at.
  const locationHash = useLocationHash();
  const stickyStepIndex = useMemo(
    () => extractStickyStepIndex(currentPage.content, currentPage.id),
    [currentPage.content, currentPage.id],
  );
  const activeStep = useMemo(() => {
    const key = locationHash.replace(/^#/, "");
    return key ? (stickyStepIndex.get(key) ?? null) : null;
  }, [locationHash, stickyStepIndex]);

  // All search state (tokens, filtered categories, debounced re-indexing)
  // lives in `useKbSearch`. Results are presented in the single top search.
  const { tokens, filteredCategories, smartSearch, searching, indexing } = useKbSearch(searchQuery);

  // Jump to the first highlighted match inside the article whenever the
  // query or current page changes. Runs after the article re-renders.
  useEffect(() => {
    if (!searching) {
      // Query cleared — drop any lingering active-match anchor so future
      // searches don't accidentally target a stale element, and reset the
      // scroll tick so the next click starts from a clean state.
      const stale = document.getElementById("kb-first-match");
      if (stale) stale.removeAttribute("id");
      return;
    }
    // Two rAFs + a short fallback: wait for the article to re-render with the
    // new query/page before locating the highlighted anchor.
    let raf1 = 0;
    let raf2 = 0;
    const tryScroll = () => {
      const el = document.getElementById("kb-first-match");
      if (el) el.scrollIntoView({ behavior: scrollBehavior, block: "center" });
    };
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(tryScroll);
    });
    const timeout = window.setTimeout(tryScroll, 120);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timeout);
    };
  }, [searchQuery, selectedPageId, searching, scrollBehavior, scrollTick]);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";
  const currentCategory = findCategoryForPage(currentPage.id);
  const isImmersive = currentPage.layout === "immersive-slideshow";
  const hasArticleOutline = !isHome && articleHeadings.length > 0;
  const sidebarGridClass = isHome
    ? "grid-cols-1"
    : isImmersive
      ? "lg:grid-cols-[288px_minmax(0,1fr)]"
      : rightTocOpen && hasArticleOutline
        ? "lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)_240px]"
        : "lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)_64px]";

  // Close the mobile sidebar sheet when the user navigates to a page.
  useEffect(() => {
    setSidebarOpen(false);
    setHelpfulResponse(null);
    setLinkCopied(false);
  }, [isHome, selectedPageId]);

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-brand-surface-alt text-brand-ink">
      <a
        href="#kb-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-brand focus:bg-brand-navy focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-on-navy focus:shadow-elev-2"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-b-brand-hairline bg-brand-surface-alt/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            {!isHome && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
                className="-ml-2 h-9 w-9 text-brand-muted hover:bg-brand-sky-soft hover:text-brand-ink lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <button
              type="button"
              onClick={goHome}
              aria-label={siteBrand.homeLabel}
              className="group -ml-1 flex cursor-pointer items-center gap-2 rounded-brand px-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:gap-3"
            >
              <img
                src={siteBrand.assets.logo.src}
                alt=""
                aria-hidden="true"
                width={siteBrand.assets.logo.width}
                height={siteBrand.assets.logo.height}
                className="h-11 w-9 shrink-0 object-contain drop-shadow-sm transition-transform duration-200 group-hover:-translate-y-px"
              />
              <span className="leading-tight">
                <span className="h5 block text-brand-ink">{siteBrand.name}</span>
                <span className="text-eyebrow hidden text-brand-muted sm:block">
                  {siteBrand.productName}
                </span>
              </span>
            </button>
          </div>
          {!isHome && (
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="body mx-4 hidden h-10 min-w-0 max-w-xl flex-1 cursor-pointer items-center gap-3 rounded-brand border border-brand-hairline bg-brand-surface px-3 text-left text-brand-muted shadow-elev-1 transition-[background-color,border-color,box-shadow] duration-200 hover:border-brand-sky hover:shadow-panel-soft focus:outline-none focus:ring-2 focus:ring-ring/40 md:flex"
              aria-label="Ask a question or search articles"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">Ask a question or search articles</span>
              <span className="small hidden shrink-0 items-center gap-1 text-primary lg:inline-flex">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Smart
              </span>
              <kbd className="small hidden rounded border border-brand-hairline bg-brand-surface-alt px-1.5 py-0.5 font-medium text-brand-muted lg:inline-flex">
                {shortcutLabel}
              </kbd>
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isHome && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCommandOpen(true)}
                  aria-label="Ask a question or search articles"
                  className="h-9 w-9 text-brand-muted hover:bg-brand-sky-soft hover:text-brand-ink sm:hidden"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCommandOpen(true)}
                  className="hidden h-9 rounded-brand border-brand-hairline px-3 text-brand-muted hover:border-brand-sky hover:text-brand-ink sm:inline-flex md:hidden"
                >
                  <Search className="h-4 w-4" />
                  Ask or search
                </Button>
              </>
            )}
            <TooltipProvider delayDuration={350}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      mounted
                        ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
                        : "Toggle theme"
                    }
                    onClick={toggleTheme}
                    className="h-9 w-9 text-brand-muted hover:bg-brand-sky-soft hover:text-brand-ink"
                  >
                    {/* Render icon only after hydration to avoid SSR/CSR mismatch */}
                    <span className="block h-5 w-5" suppressHydrationWarning>
                      {mounted ? (
                        theme === "dark" ? (
                          <Sun className="h-5 w-5" />
                        ) : (
                          <Moon className="h-5 w-5" />
                        )
                      ) : null}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Theme"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Contact support"
                    onClick={() => setContactOpen(true)}
                    className="h-9 w-9 text-brand-muted hover:bg-brand-sky-soft hover:text-brand-ink"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Contact support</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none ${sidebarGridClass}`}
      >
        {!isHome &&
          (() => {
            const sidebarBody = () => {
              return (
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-docs-sidebar text-docs-sidebar-foreground">
                  {!isHome && !searching && continuePageId && pageContents[continuePageId] && (
                    <div className="mx-3 mt-4 mb-3 flex items-center gap-1 rounded-brand border border-docs-sidebar-border bg-docs-sidebar-elevated/60 p-1 transition-colors duration-200 hover:bg-docs-sidebar-elevated">
                      <button
                        type="button"
                        onClick={() => {
                          const pageId = continuePageId;
                          suppressNextContinueRef.current = true;
                          setContinuePageId(null);
                          selectPage(pageId);
                        }}
                        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-docs-sidebar-active focus:outline-none focus:ring-2 focus:ring-ring/40"
                        aria-label={`Continue reading ${pageContents[continuePageId].title}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5 shrink-0 text-docs-sidebar-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="small block font-semibold text-docs-sidebar-foreground">
                            Continue reading
                          </span>
                          <span className="small block truncate text-docs-sidebar-muted">
                            {pageContents[continuePageId].title}
                          </span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-docs-sidebar-muted transition-transform group-hover:translate-x-0.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContinuePageId(null)}
                        aria-label="Dismiss continue reading"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-docs-sidebar-muted transition-colors hover:bg-docs-sidebar-active hover:text-docs-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div
                    data-kb-sidebar-scroll
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-color:var(--docs-sidebar-border)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
                  >
                    <nav id="kb-results" className="space-y-5" aria-label="Documentation">
                      {sidebarCategories.map((category) => {
                        const rootPages: (typeof category.subPages)[number][] = [];
                        const childrenByParent = new Map<
                          string,
                          (typeof category.subPages)[number][]
                        >();
                        category.subPages.forEach((page) => {
                          if (!page.parentArticleId) {
                            rootPages.push(page);
                            return;
                          }
                          const siblings = childrenByParent.get(page.parentArticleId) ?? [];
                          siblings.push(page);
                          childrenByParent.set(page.parentArticleId, siblings);
                        });
                        return (
                          <div key={category.id}>
                            <div className="h6 rounded-md border border-docs-sidebar-border bg-docs-sidebar-section px-3 py-1.5 text-docs-sidebar-foreground">
                              {category.name}
                            </div>
                            <div className="mt-1.5 space-y-0.5">
                              {rootPages.map((subPage) => {
                                const active = !isHome && selectedPageId === subPage.id;
                                const childSubs = childrenByParent.get(subPage.id) ?? [];
                                return (
                                  <React.Fragment key={subPage.id}>
                                    <button
                                      onClick={() => selectPage(subPage.id)}
                                      aria-current={active ? "page" : undefined}
                                      className={`relative w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[0.9375rem] leading-[1.4] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                                        active
                                          ? "bg-docs-sidebar-active font-medium text-docs-sidebar-foreground"
                                          : "text-docs-sidebar-muted hover:bg-docs-sidebar-active/70 hover:text-docs-sidebar-foreground focus-visible:bg-docs-sidebar-active/70 focus-visible:text-docs-sidebar-foreground"
                                      }`}
                                    >
                                      {active && (
                                        <span
                                          aria-hidden="true"
                                          className="absolute left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-docs-sidebar-accent"
                                        />
                                      )}
                                      <span className="relative block">
                                        <span
                                          className={`block min-w-0 ${
                                            active
                                              ? "text-docs-sidebar-foreground font-medium"
                                              : "text-docs-sidebar-muted"
                                          }`}
                                        >
                                          {subPage.title}
                                        </span>
                                      </span>
                                    </button>
                                    {childSubs.length > 0 && (
                                      <div className="ml-3 mb-1 space-y-0.5 border-l border-docs-sidebar-border pl-2.5">
                                        {childSubs.map((child) => {
                                          const cActive = !isHome && selectedPageId === child.id;
                                          return (
                                            <button
                                              key={child.id}
                                              onClick={() => selectPage(child.id)}
                                              aria-current={cActive ? "page" : undefined}
                                              className={`relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-[0.9375rem] leading-[1.4] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                                                cActive
                                                  ? "bg-docs-sidebar-active font-medium text-docs-sidebar-foreground"
                                                  : "text-docs-sidebar-muted hover:bg-docs-sidebar-active/70 hover:text-docs-sidebar-foreground focus-visible:bg-docs-sidebar-active/70 focus-visible:text-docs-sidebar-foreground"
                                              }`}
                                            >
                                              <span className="block min-w-0">{child.title}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              );
            };
            return (
              <>
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetContent
                    side="left"
                    className="h-dvh w-[min(88vw,320px)] overflow-hidden border-docs-sidebar-border bg-docs-sidebar p-0 lg:hidden"
                  >
                    <SheetTitle className="sr-only">Documentation navigation</SheetTitle>
                    {sidebarBody()}
                  </SheetContent>
                </Sheet>
                <aside className="hidden w-72 border-r border-docs-sidebar-border bg-docs-sidebar lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:self-start lg:overflow-hidden">
                  {sidebarBody()}
                </aside>
              </>
            );
          })()}

        {isHome ? (
          <KnowledgeBaseHome
            continuePageId={continuePageId}
            onDismissContinue={() => setContinuePageId(null)}
            onOpenSearch={() => setCommandOpen(true)}
            onSelectPage={(pageId) => {
              if (pageId === continuePageId) {
                suppressNextContinueRef.current = true;
                setContinuePageId(null);
              }
              selectPage(pageId);
            }}
            reducedMotion={reducedMotion}
          />
        ) : isImmersive ? (
          <motion.main
            id="kb-main-content"
            key={currentPage.id}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
            tabIndex={-1}
            className="min-w-0 bg-brand-surface-alt"
          >
            <header className="mx-auto w-full max-w-6xl px-3 pt-6 sm:px-6 sm:pt-8 lg:px-8">
              <div className="border-b border-brand-hairline pb-6 sm:mx-[72px] sm:pb-7">
                <nav
                  aria-label="Breadcrumb"
                  className="small mb-5 flex min-w-0 items-center gap-1.5 overflow-hidden text-muted-foreground"
                >
                  <span className="hidden shrink-0 sm:inline">Knowledge Base</span>
                  <ChevronRight className="hidden h-3 w-3 shrink-0 sm:block" />
                  {currentCategory && (
                    <>
                      <span className="shrink-0 transition-colors hover:text-foreground">
                        {currentCategory.name}
                      </span>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    </>
                  )}
                  <span aria-current="page" className="truncate font-medium text-foreground">
                    {currentPage.title}
                  </span>
                </nav>
                {currentCategory && (
                  <div className="small mb-3 inline-flex items-center gap-1.5 font-semibold text-primary">
                    <span className="text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
                      {currentCategory.icon}
                    </span>
                    {currentCategory.name}
                  </div>
                )}
                <h1 className="h1 break-words text-foreground">{currentPage.title}</h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyArticleLink}
                    className="h-9 min-w-26 rounded-brand border-brand-hairline"
                    aria-live="polite"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {linkCopied ? "Copied" : "Share"}
                  </Button>
                </div>
              </div>
            </header>
            {formatContent(currentPage.content, currentPage.title, tokens, currentPage.id)}
          </motion.main>
        ) : (
          <motion.article
            id="kb-main-content"
            key={currentPage.id}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
            tabIndex={-1}
            className="w-full min-w-0 max-w-3xl px-4 py-7 min-[360px]:px-5 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:max-w-[46rem] xl:px-14"
          >
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="small mb-5 flex min-w-0 items-center gap-1.5 overflow-hidden text-muted-foreground"
            >
              <span className="hidden shrink-0 sm:inline">Knowledge Base</span>
              <ChevronRight className="hidden h-3 w-3 shrink-0 sm:block" />
              {(() => {
                const cat = findCategoryForPage(currentPage.id);
                return cat ? (
                  <>
                    <span className="hover:text-foreground transition-colors">{cat.name}</span>
                    <ChevronRight className="h-3 w-3" />
                  </>
                ) : null;
              })()}
              {(() => {
                const isChooserPage =
                  /\[chooser-cards:[\w-]+\]/.test(currentPage.content) ||
                  chooserFlowArticleIds.has(currentPage.id);
                return (
                  <>
                    {currentPage.parentArticleId && pageContents[currentPage.parentArticleId] && (
                      <>
                        <button
                          type="button"
                          onClick={() => selectPage(currentPage.parentArticleId!)}
                          className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
                        >
                          {pageContents[currentPage.parentArticleId!].title}
                        </button>
                        <ChevronRight className="h-3 w-3" />
                      </>
                    )}
                    <span aria-current="page" className="truncate text-foreground font-medium">
                      {currentPage.title}
                    </span>
                    {activeStep && !isChooserPage && (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span
                          aria-current="step"
                          className="small hidden min-w-0 items-center gap-1 text-foreground/90 sm:inline-flex"
                        >
                          <span className="small rounded-full bg-primary/10 px-1.5 py-0.5 font-semibold tabular-nums text-primary">
                            Step {activeStep.number}
                          </span>
                          <span className="max-w-[16rem] truncate">{activeStep.title}</span>
                        </span>
                      </>
                    )}
                  </>
                );
              })()}
            </nav>

            <header className="mb-10 border-b border-brand-hairline pb-8">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {currentCategory && (
                    <span className="small inline-flex items-center gap-1.5 font-semibold text-primary">
                      <span className="text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
                        {currentCategory.icon}
                      </span>
                      {currentCategory.name}
                    </span>
                  )}
                </div>
                <h1 className="h1 break-words text-foreground">{currentPage.title}</h1>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyArticleLink}
                  className="h-9 min-w-26 rounded-brand border-brand-hairline"
                  aria-live="polite"
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {linkCopied ? "Copied" : "Share"}
                </Button>
                {hasStepsSection && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={scrollToSteps}
                    className="h-9 rounded-brand px-3"
                  >
                    Start the steps
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </header>

            {articleHeadings.length > 0 && (
              <div className="sticky top-16 z-20 mb-10 xl:hidden">
                <TableOfContents
                  headings={articleHeadings}
                  articleId={currentPage.id}
                  variant="inline"
                />
              </div>
            )}

            <div
              id="kb-article-top"
              className="body min-w-0 max-w-none break-words [&_iframe]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            >
              {formatContent(currentPage.content, currentPage.title, tokens, currentPage.id)}
            </div>

            {(() => {
              const parentId = currentPage.parentArticleId;
              const children = getChildren(currentPage.id);
              if (!parentId && children.length === 0) return null;
              const parent = parentId ? pageContents[parentId] : null;
              const series = parent ? getChildren(parent.id) : children;
              const seriesParent = parent ?? currentPage;
              return (
                <section id="kb-related" aria-label="In this series" className="mt-16">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="h5 text-foreground">In this series</h2>
                    <button
                      type="button"
                      onClick={() => selectPage(seriesParent.id)}
                      className="h6 text-muted-foreground hover:text-primary"
                    >
                      {seriesParent.title}
                    </button>
                  </div>
                  <ul className="mt-4 divide-y divide-brand-hairline rounded-brand border border-brand-hairline bg-brand-surface">
                    {series.map((s) => {
                      const active = s.id === currentPage.id;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => selectPage(s.id)}
                            className={`body flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-brand-surface-alt"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`h-1.5 w-1.5 rounded-full ${active ? "bg-primary" : "bg-brand-hairline"}`}
                            />
                            <span className="truncate">{s.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })()}

            {(() => {
              const cat = findCategoryForPage(currentPage.id);
              const { pages: related, matchMode } = getRelatedArticles(
                currentPage,
                Object.values(pageContents),
                cat,
              );
              if (related.length === 0) return null;
              const heading =
                matchMode === "tags" ? "Related by tags" : cat ? `More in ${cat.name}` : "Related";
              return (
                <section
                  aria-labelledby="related-articles-heading"
                  className="mt-16 border-t border-brand-hairline pt-10"
                >
                  <div className="mb-5 flex items-baseline justify-between gap-3">
                    <h2 id="related-articles-heading" className="h3 text-foreground">
                      Related Articles
                    </h2>
                    <span className="h6 text-muted-foreground">{heading}</span>
                  </div>
                  <ul className="divide-y divide-brand-hairline rounded-brand border border-brand-hairline bg-brand-surface">
                    {related.map((r) => {
                      const rCat = findCategoryForPage(r.id);
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => selectPage(r.id)}
                            className="group grid w-full cursor-pointer gap-2 px-5 py-4 text-left transition-colors duration-200 hover:bg-brand-surface-alt focus:outline-none focus:ring-2 focus:ring-primary sm:grid-cols-[minmax(0,1fr)_auto]"
                          >
                            <span className="min-w-0">
                              <span className="h5 block truncate text-foreground transition-colors group-hover:text-primary">
                                {r.title}
                              </span>
                              <span className="small mt-1 flex items-center gap-2 text-muted-foreground">
                                <span className="text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">
                                  {rCat?.icon}
                                </span>
                                {rCat?.name ?? "Related"}
                              </span>
                            </span>
                            <span className="small flex items-center gap-1.5 text-muted-foreground sm:justify-end">
                              <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })()}

            {(previousArticle || nextArticle) && (
              <nav
                aria-label="Article navigation"
                className="mt-14 grid gap-3 border-t border-brand-hairline pt-8 sm:grid-cols-2"
              >
                {previousArticle ? (
                  <button
                    type="button"
                    onClick={() => selectPage(previousArticle.id)}
                    className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-brand border border-brand-hairline bg-brand-surface px-4 py-3 text-left shadow-panel-soft transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky/60 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                    <span className="min-w-0">
                      <span className="small block font-medium text-muted-foreground">
                        Previous article
                      </span>
                      <span className="body mt-0.5 block font-semibold leading-snug text-foreground">
                        {previousArticle.title}
                      </span>
                      <span className="small mt-1 block text-muted-foreground">
                        {previousArticle.categoryName}
                      </span>
                    </span>
                  </button>
                ) : (
                  <span aria-hidden="true" className="hidden sm:block" />
                )}
                {nextArticle && (
                  <button
                    type="button"
                    onClick={() => selectPage(nextArticle.id)}
                    className="group flex min-h-20 cursor-pointer items-center justify-end gap-3 rounded-brand border border-brand-hairline bg-brand-surface px-4 py-3 text-right shadow-panel-soft transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky/60 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <span className="min-w-0">
                      <span className="small block font-medium text-muted-foreground">
                        Next article
                      </span>
                      <span className="body mt-0.5 block font-semibold leading-snug text-foreground">
                        {nextArticle.title}
                      </span>
                      <span className="small mt-1 block text-muted-foreground">
                        {nextArticle.categoryName}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </nav>
            )}

            <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-brand-hairline pt-8">
              <div aria-live="polite">
                <div className="body flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {helpfulResponse ? "Thanks for your feedback" : "Was this article helpful?"}
                </div>
                {!helpfulResponse && (
                  <p className="small mt-1 text-muted-foreground">
                    Your response helps improve these guides.
                  </p>
                )}
              </div>
              <div className="flex gap-2" role="group" aria-label="Article feedback">
                <Button
                  type="button"
                  variant={helpfulResponse === "yes" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={helpfulResponse === "yes"}
                  onClick={() => setHelpfulResponse("yes")}
                  className="min-w-20"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={helpfulResponse === "no" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={helpfulResponse === "no"}
                  onClick={() => setHelpfulResponse("no")}
                  className="min-w-20"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </Button>
              </div>
            </footer>
          </motion.article>
        )}

        {/* Sticky desktop page outline */}
        {!isHome && !isImmersive && (
          <aside
            aria-label={siteBrand.pageOutline.label}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !rightTocOpen) return;
              event.stopPropagation();
              closeRightTocAfterNavigation();
              window.requestAnimationFrame(() => rightTocButtonRef.current?.focus());
            }}
            className="hidden border-l border-brand-hairline bg-brand-surface-alt/35 xl:block"
          >
            <div
              onMouseEnter={openRightTocFromHoverOrFocus}
              onMouseLeave={scheduleRightTocClose}
              onFocusCapture={openRightTocFromHoverOrFocus}
              onBlurCapture={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                scheduleRightTocClose();
              }}
              className="sticky top-20 flex min-h-0 max-h-[calc(100vh-6rem)] flex-col items-end gap-0 px-2 py-4"
            >
              {hasArticleOutline && (
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MotionButton
                        ref={rightTocButtonRef}
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={
                          rightTocOpen
                            ? siteBrand.pageOutline.hideLabel
                            : siteBrand.pageOutline.showLabel
                        }
                        aria-expanded={rightTocOpen}
                        aria-controls="kb-page-outline"
                        onClick={toggleRightToc}
                        animate={
                          reducedMotion || rightTocOpen
                            ? { y: 0, rotate: 0 }
                            : {
                                y: [0, -6, 0, -2, 0],
                                rotate: [0, -1.5, 1.5, -0.5, 0],
                              }
                        }
                        transition={
                          reducedMotion || rightTocOpen
                            ? { duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }
                            : {
                                duration: 1.35,
                                times: [0, 0.28, 0.52, 0.72, 1],
                                repeat: Infinity,
                                repeatDelay: 2.6,
                                ease: "easeInOut",
                              }
                        }
                        whileHover={reducedMotion ? undefined : { y: -2, scale: 1.04 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                        className={`relative z-10 h-[3.25rem] w-[3.25rem] shrink-0 cursor-pointer overflow-visible rounded-full p-1.5 shadow-panel-soft transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:shadow-panel motion-reduce:transition-none ${
                          rightTocOpen
                            ? "border-primary/50 bg-primary text-primary-foreground hover:border-primary hover:bg-primary/90"
                            : "border-brand-hairline bg-brand-surface text-primary hover:border-brand-sky/60 hover:bg-brand-sky-soft"
                        }`}
                      >
                        {!reducedMotion && (
                          <motion.span
                            key={rightTocOpen ? "outline-bubble-open" : "outline-bubble-close"}
                            aria-hidden="true"
                            initial={
                              rightTocOpen
                                ? { opacity: 0.42, scale: 1 }
                                : { opacity: 0.32, scale: 1.32 }
                            }
                            animate={{ opacity: 0, scale: rightTocOpen ? 1.32 : 1 }}
                            transition={{
                              duration: rightTocOpen ? 0.3 : 0.22,
                              ease,
                            }}
                            className="pointer-events-none absolute inset-0 rounded-full border border-current"
                          />
                        )}
                        <motion.img
                          key={rightTocOpen ? "bird-open" : "bird-closed"}
                          src={siteBrand.assets.pageOutlineIcon.src}
                          alt=""
                          aria-hidden="true"
                          width={siteBrand.assets.pageOutlineIcon.width}
                          height={siteBrand.assets.pageOutlineIcon.height}
                          initial={
                            reducedMotion ? false : { opacity: 0.65, rotate: -8, scale: 0.78 }
                          }
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
                          className="h-9 w-9 object-contain drop-shadow-sm"
                        />
                        <AnimatePresence initial={false}>
                          {rightTocOpen && (
                            <motion.span
                              aria-hidden="true"
                              initial={reducedMotion ? false : { opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{
                                duration: reducedMotion ? 0 : motionTiming.quick,
                                ease,
                              }}
                              className="absolute -right-1 -top-1 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border border-brand-hairline bg-brand-surface text-primary shadow-elev-1"
                            >
                              <X className="!h-2.5 !w-2.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </MotionButton>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      {rightTocOpen
                        ? siteBrand.pageOutline.hideLabel
                        : siteBrand.pageOutline.showLabel}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <AnimatePresence initial={false}>
                {rightTocOpen && hasArticleOutline && (
                  <motion.div
                    id="kb-page-outline"
                    role="region"
                    aria-label="Article page outline"
                    initial={
                      reducedMotion
                        ? false
                        : {
                            opacity: 0.35,
                            y: -6,
                            scale: 0.16,
                          }
                    }
                    animate={
                      reducedMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 1,
                            x: 0,
                            y: 0,
                            scale: 1,
                          }
                    }
                    exit={
                      reducedMotion
                        ? { opacity: 0, transition: { duration: 0 } }
                        : {
                            opacity: 0,
                            y: -6,
                            scale: 0.16,
                            transition: { duration: 0.22, ease: "easeIn" },
                          }
                    }
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease }}
                    style={{ transformOrigin: "calc(100% - 26px) -22px" }}
                    className="relative z-0 -mt-1 w-56"
                  >
                    <div className="relative z-0 max-h-[calc(100vh-8.75rem)] overflow-y-auto rounded-brand border border-brand-hairline bg-brand-surface p-4 shadow-panel [scrollbar-gutter:stable]">
                      <TableOfContents
                        headings={articleHeadings}
                        articleId={currentPage.id}
                        onNavigate={closeRightTocAfterNavigation}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        )}
      </div>
      <SmartSearchDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        response={smartSearch}
        indexing={indexing}
        currentPageId={isHome ? undefined : selectedPageId}
        onSelectArticle={selectPageAndScroll}
      />
      <ContactSupportDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        contextPageTitle={isHome ? `${siteBrand.name} home` : currentPage.title}
      />
    </div>
  );
};
