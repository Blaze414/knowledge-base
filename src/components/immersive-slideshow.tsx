import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slideshow } from "@/content/slideshows";

interface ImmersiveSlideshowProps {
  slideshow: Slideshow;
}

const transitionEase = [0.22, 1, 0.36, 1] as const;
const transitionDuration = 0.3;
const textTransitionDistance = 14;
const imageTransitionDistance = 56;

export function ImmersiveSlideshow({ slideshow }: ImmersiveSlideshowProps) {
  const total = slideshow.steps.length;
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [restored, setRestored] = React.useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const storageKey = `kb:slideshow:last-step:${slideshow.storageKey ?? "immersive"}`;

  const navigate = React.useCallback(
    (nextIndex: number, nextDirection: number) => {
      setDirection(nextDirection);
      setIndex(Math.min(Math.max(nextIndex, 0), total - 1));
    },
    [total],
  );

  const previous = React.useCallback(() => navigate(index - 1, -1), [index, navigate]);
  const next = React.useCallback(() => navigate(index + 1, 1), [index, navigate]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous]);

  React.useEffect(() => {
    try {
      const savedIndex = Number(window.localStorage.getItem(storageKey));
      if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < total) {
        setIndex(savedIndex);
      }
    } catch {
      // Storage may be unavailable in private or restricted browsing modes.
    } finally {
      setRestored(true);
    }
  }, [storageKey, total]);

  React.useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(storageKey, String(index));
    } catch {
      // The slideshow still works when storage is unavailable.
    }
  }, [index, restored, storageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined" || total < 2) return;
    [index - 1, index + 1].forEach((target) => {
      if (target < 0 || target >= total) return;
      const image = new window.Image();
      image.decoding = "async";
      image.src = slideshow.steps[target].image;
    });
  }, [index, slideshow.steps, total]);

  const step = slideshow.steps[index];
  const stepNumber = step.stepNumber ?? String(index + 1);
  const atStart = index === 0;
  const atEnd = index === total - 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={slideshow.title ?? "Customer support walkthrough"}
      className="flex min-h-[calc(100dvh-4rem)] w-full flex-col justify-start overflow-hidden bg-brand-surface-alt px-3 py-6 text-foreground sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <div className="grid grid-cols-[0_minmax(0,1fr)_0] gap-0 sm:grid-cols-[56px_minmax(0,1fr)_56px] sm:gap-x-4">
          <div className="col-start-2 pb-2.5 sm:pb-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`heading-${index}`}
                initial={
                  reducedMotion ? false : { opacity: 0, y: direction * textTransitionDistance }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: direction * -textTransitionDistance }
                }
                transition={{
                  duration: reducedMotion ? 0 : transitionDuration,
                  ease: transitionEase,
                }}
              >
                <div className="flex max-w-4xl items-center gap-3 sm:gap-4">
                  <span
                    aria-hidden="true"
                    className="small relative z-10 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-primary px-2 font-semibold tabular-nums text-primary-foreground shadow-elev-1 sm:h-10 sm:min-w-10"
                  >
                    {stepNumber}
                  </span>
                  <h2 className="text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
                    <span className="sr-only">Step {stepNumber}: </span>
                    {step.title}
                  </h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="col-start-1 row-start-2 flex items-center justify-center">
            <button
              type="button"
              onClick={previous}
              disabled={atStart}
              aria-label="Previous slide"
              className="z-10 flex h-11 w-11 translate-x-[11px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-hairline bg-brand-surface/95 text-foreground shadow-panel-soft backdrop-blur transition-[border-color,background-color,color,opacity] duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:border-primary focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-brand-hairline disabled:hover:bg-brand-surface disabled:hover:text-foreground sm:h-12 sm:w-12 sm:translate-x-0"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative col-start-2 row-start-2 aspect-[16/10] overflow-hidden rounded-brand border border-brand-hairline bg-brand-surface shadow-panel">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.img
                key={step.image}
                src={step.image}
                alt={step.alt}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                custom={direction}
                initial={
                  reducedMotion ? false : { opacity: 0, x: direction * imageTransitionDistance }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction * -imageTransitionDistance }
                }
                transition={{
                  duration: reducedMotion ? 0 : transitionDuration,
                  ease: transitionEase,
                }}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </AnimatePresence>
          </div>

          <div className="col-start-3 row-start-2 flex items-center justify-center">
            <button
              type="button"
              onClick={next}
              disabled={atEnd}
              aria-label="Next slide"
              className="z-10 flex h-11 w-11 -translate-x-[11px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-hairline bg-brand-surface/95 text-foreground shadow-panel-soft backdrop-blur transition-[border-color,background-color,color,opacity] duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:border-primary focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-brand-hairline disabled:hover:bg-brand-surface disabled:hover:text-foreground sm:h-12 sm:w-12 sm:translate-x-0"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="col-start-2 row-start-3 border-t border-brand-hairline bg-brand-surface px-4 py-4 sm:px-5 sm:py-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`description-${index}`}
                initial={
                  reducedMotion ? false : { opacity: 0, y: direction * textTransitionDistance }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: direction * -textTransitionDistance }
                }
                transition={{
                  duration: reducedMotion ? 0 : transitionDuration,
                  ease: transitionEase,
                }}
                className="max-w-3xl text-base leading-relaxed text-muted-foreground"
              >
                {step.description}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex h-14 shrink-0 items-end justify-center sm:mt-1">
          <div
            className="group/steps relative flex h-9 items-center gap-1 rounded-full border border-brand-hairline bg-brand-surface px-2 shadow-panel-soft backdrop-blur transition-[height,padding,gap] duration-300 ease-out hover:h-14 hover:gap-1.5 hover:px-3 focus-within:h-14 focus-within:gap-1.5 focus-within:px-3"
            role="tablist"
            aria-label="Slideshow steps"
          >
            {slideshow.steps.map((slide, slideIndex) => {
              const active = slideIndex === index;
              const slideNumber = slide.stepNumber ?? String(slideIndex + 1);
              const previewPosition =
                slideIndex === 0
                  ? "left-0"
                  : slideIndex === total - 1
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";
              return (
                <button
                  key={slide.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to step ${slideNumber}: ${slide.title}`}
                  onClick={() =>
                    navigate(
                      slideIndex,
                      slideIndex === index ? direction : slideIndex > index ? 1 : -1,
                    )
                  }
                  className={`group/step relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-[width,height,background-color,color] duration-300 group-hover/steps:h-9 group-hover/steps:w-9 group-focus-within/steps:h-9 group-focus-within/steps:w-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full transition-opacity duration-200 group-hover/steps:opacity-0 group-focus-within/steps:opacity-0 ${
                      active ? "bg-primary-foreground" : "bg-muted-foreground/55"
                    }`}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold opacity-0 transition-opacity delay-75 duration-200 group-hover/steps:opacity-100 group-focus-within/steps:opacity-100">
                    {slideNumber}
                  </span>
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-[calc(100%+0.75rem)] z-50 w-64 rounded-brand border border-brand-hairline bg-brand-surface p-3 text-left text-foreground opacity-0 shadow-elev-2 transition-[opacity,transform] duration-200 group-hover/step:-translate-y-1 group-hover/step:opacity-100 group-focus-visible/step:-translate-y-1 group-focus-visible/step:opacity-100 ${previewPosition}`}
                  >
                    <span className="text-eyebrow block font-semibold text-primary">
                      Step {slideNumber}
                    </span>
                    <span className="body mt-1 block font-semibold leading-snug">
                      {slide.title}
                    </span>
                    <span className="small mt-1.5 block leading-relaxed text-muted-foreground">
                      {slide.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Step {stepNumber} of {total}: {step.title}
        </p>
      </div>
    </section>
  );
}
