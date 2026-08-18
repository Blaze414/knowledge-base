import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;
const motionTiming = {
  standard: 0.22,
};

/**
 * `history.replaceState` does NOT fire the `hashchange` event, so anything
 * outside this component that reacts to the URL hash (e.g. the breadcrumb's
 * active-step segment) would otherwise stay stale. Dispatch a synthetic
 * event alongside every replaceState so listeners can subscribe to a single
 * "hash moved" signal.
 */
function replaceHash(next: string) {
  if (typeof window === "undefined") return;
  if (window.location.hash === next) return;
  window.history.replaceState(null, "", next);
  window.dispatchEvent(new Event("lovable:hashchange"));
}

export interface StickyStep {
  number: string;
  title: string;
  /** Pre-rendered React nodes for the step body. */
  body: ReactNode;
  /** Plain-text version of the title, for the side-rail label. */
  titleText: string;
}

export interface KbStickyStepsProps {
  steps: StickyStep[];
  /** Stable id used to namespace step anchors so multiple blocks can coexist. */
  scopeId: string;
}

/**
 * Sticky side-rail step layout. The left rail lists every step number +
 * title and highlights the active one as the reader scrolls; the right
 * column renders each step as a generous card with a large numbered badge.
 *
 * On small screens the rail collapses into a horizontal progress strip
 * pinned to the top of the steps container so it never blocks content.
 */
export function KbStickySteps({ steps, scopeId }: KbStickyStepsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const userInteractedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const scrollBehavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

  // Stable, unique anchor id for every step under this block.
  const stepId = useMemo(
    () => (i: number) => `${scopeId}-step-${steps[i]?.number ?? i + 1}`,
    [scopeId, steps],
  );

  // Resolve a hash like "#scope-step-2" to an index in this block.
  const indexFromHash = useMemo(
    () => (hash: string) => {
      const clean = hash.replace(/^#/, "");
      if (!clean) return -1;
      return steps.findIndex((_, i) => stepId(i) === clean);
    },
    [steps, stepId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = stepRefs.current.filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    // Track the topmost step whose heading has crossed ~25% of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry highest on the page that is currently intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const idx = els.indexOf(visible[0].target as HTMLElement);
          if (idx !== -1) {
            setActiveIndex(idx);
            // Keep the URL hash in sync once the user has started reading,
            // so refresh / share preserves position. replaceState avoids
            // polluting browser history while scrolling.
            if (userInteractedRef.current) {
              const next = `#${stepId(idx)}`;
              replaceHash(next);
            }
          }
        }
      },
      {
        // Activate when the heading reaches roughly the top quarter of the viewport.
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      },
    );

    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [steps.length, stepId]);

  // Deep-link support: on mount and on hashchange, scroll to the matching
  // step and mark it active in the rail.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyHash = (behavior: ScrollBehavior) => {
      const idx = indexFromHash(window.location.hash);
      if (idx < 0) return;
      const el = stepRefs.current[idx];
      if (!el) return;
      setActiveIndex(idx);
      userInteractedRef.current = true;
      // Defer to let layout settle (images, fonts) before scrolling.
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : behavior, block: "start" });
      });
    };

    applyHash("auto");
    const onHashChange = () => applyHash("smooth");
    // Browser back/forward: `popstate` fires for every history navigation,
    // including ones where only search params changed (no `hashchange`).
    // Re-applying keeps the active step + URL hash in sync with whatever
    // the browser restored.
    const onPopState = () => applyHash("auto");
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, [indexFromHash, reducedMotion]);

  const scrollToStep = (i: number) => {
    const el = stepRefs.current[i];
    if (!el) return;
    userInteractedRef.current = true;
    const next = `#${stepId(i)}`;
    replaceHash(next);
    el.scrollIntoView({ behavior: scrollBehavior, block: "start" });
  };

  return (
    <section
      aria-label="Step-by-step guide"
      className="my-10 rounded-brand-lg border border-brand-hairline bg-brand-surface p-5 sm:p-6"
    >
      {/* Mobile progress strip — horizontal, sticky to the top of the section. */}
      <div className="sticky top-14 z-10 -mx-5 mb-5 border-b border-brand-hairline bg-card/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6 md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {steps.map((s, i) => {
            const isActive = i === activeIndex;
            const isDone = i < activeIndex;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => scrollToStep(i)}
                className={[
                  "small flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-medium transition-colors duration-150",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-elev-1"
                    : isDone
                      ? "border-brand-sky/30 bg-brand-sky-soft text-foreground"
                      : "border-brand-hairline bg-background text-muted-foreground hover:border-brand-sky/40 hover:text-foreground",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background/40 px-1 text-[10px] font-semibold tabular-nums">
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
                </span>
                <span className="max-w-[10rem] truncate">{s.titleText}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{
              width: `${((activeIndex + 1) / steps.length) * 100}%`,
            }}
            transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
        {/* Sticky rail (desktop). */}
        <aside className="hidden md:block">
          <nav aria-label="Step navigation" className="sticky top-28">
            <p className="h6 mb-4 text-muted-foreground">On this guide</p>
            <ol className="relative space-y-1.5 border-l border-brand-hairline pl-0">
              {steps.map((s, i) => {
                const isActive = i === activeIndex;
                const isDone = i < activeIndex;
                return (
                  <li key={s.number} className="relative">
                    <button
                      type="button"
                      onClick={() => scrollToStep(i)}
                      aria-current={isActive ? "step" : undefined}
                      className={[
                        "body group flex w-full items-start gap-3 rounded-lg py-2.5 pl-4 pr-2 text-left transition-colors duration-150",
                        isActive
                          ? "bg-brand-sky-soft text-foreground"
                          : "text-muted-foreground hover:bg-brand-sky-soft hover:text-foreground",
                      ].join(" ")}
                    >
                      {/* Active indicator bar replacing the left border. */}
                      <span
                        aria-hidden="true"
                        className={[
                          "absolute left-[-1px] top-2 bottom-2 w-[2px] rounded-full transition-colors duration-150",
                          isActive ? "bg-brand-sky" : "bg-transparent",
                        ].join(" ")}
                      />
                      <span
                        className={[
                          "mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums transition-colors duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-elev-1"
                            : isDone
                              ? "bg-brand-sky-soft text-primary"
                              : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20",
                        ].join(" ")}
                      >
                        {isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
                      </span>
                      <span
                        className={["body min-w-0 flex-1", isActive ? "font-semibold" : ""].join(
                          " ",
                        )}
                      >
                        {s.titleText}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 rounded-lg border border-brand-hairline bg-brand-surface-alt/70 p-4">
              <p className="h6 text-muted-foreground">Progress</p>
              <p className="h5 mt-1 text-foreground">
                Step {Math.min(activeIndex + 1, steps.length)}{" "}
                <span className="text-muted-foreground">of {steps.length}</span>
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{
                    width: `${((activeIndex + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ duration: reducedMotion ? 0 : motionTiming.standard, ease }}
                />
              </div>
            </div>
          </nav>
        </aside>

        {/* Steps content column. */}
        <div className="min-w-0 space-y-5">
          {steps.map((s, i) => (
            <article
              key={s.number}
              id={stepId(i)}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="scroll-mt-24 rounded-lg border border-brand-hairline bg-brand-surface p-5 sm:p-6"
            >
              <header className="mb-4 flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="h5 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-primary-foreground shadow-elev-1"
                >
                  {s.number}
                </span>
                <div className="min-w-0">
                  <p className="h6 text-muted-foreground">
                    Step {s.number} of {steps.length}
                    <span className="mx-1.5 text-brand-hairline">/</span>
                    Key action
                  </p>
                  <h3 className="h3 mt-0.5 text-foreground">{s.title}</h3>
                </div>
              </header>
              <div className="space-y-3 [&_h3]:hidden">{s.body}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
