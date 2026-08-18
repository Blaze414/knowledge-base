import * as React from "react";

import { cn } from "@/lib/utils";

type FeatureGridProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Column count at the widest breakpoint. Responsive fallbacks are handled
   *  automatically: 1 col mobile → 2 cols sm/md → `columns` at lg+. */
  columns?: 2 | 3 | 4;
};

const columnMap: Record<NonNullable<FeatureGridProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Responsive grid for FeatureCards. Spacing follows the guideline:
 *  - 24px gap between tiles (32px at lg)
 *  - 1 column on mobile so tiles are full-width readable
 *  - 2 columns from sm, promoting to 3/4 at lg
 */
export const FeatureGrid = React.forwardRef<HTMLDivElement, FeatureGridProps>(
  ({ className, columns = 3, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid grid-cols-1 gap-6 lg:gap-8", columnMap[columns], className)}
      {...props}
    />
  ),
);
FeatureGrid.displayName = "FeatureGrid";

type FeatureSectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Small uppercase kicker above the title (rendered with text-eyebrow). */
  eyebrow?: React.ReactNode;
  /** Section headline. Rendered as h2 with Rubik/display metrics. */
  title?: React.ReactNode;
  /** Longer supporting paragraph (rendered with text-lede). */
  description?: React.ReactNode;
  /** Optional action node aligned to the right on md+ (e.g. a CTA link). */
  action?: React.ReactNode;
  /** Alternates section background between white and off-white per guideline. */
  tone?: "default" | "muted";
  /** Centers the header block for landing-style hero sections. */
  align?: "start" | "center";
  /** Max-width container. Defaults to 6xl to match evidence-heavy layouts. */
  container?: "5xl" | "6xl" | "7xl";
};

const containerMap: Record<NonNullable<FeatureSectionProps["container"]>, string> = {
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

/**
 * Modular feature section: alternating background band + centered container
 * + optional eyebrow/title/description/action header + grid slot.
 *
 * Usage:
 *   <FeatureSection eyebrow="Compliance" title="Audit-ready by design">
 *     <FeatureGrid columns={3}>
 *       <FeatureCard ... />
 *     </FeatureGrid>
 *   </FeatureSection>
 */
export const FeatureSection = React.forwardRef<HTMLElement, FeatureSectionProps>(
  (
    {
      className,
      eyebrow,
      title,
      description,
      action,
      tone = "default",
      align = "start",
      container = "6xl",
      children,
      ...props
    },
    ref,
  ) => {
    const centered = align === "center";
    const hasHeader = Boolean(eyebrow || title || description || action);

    return (
      <section
        ref={ref}
        className={cn(
          "w-full py-16 sm:py-20 lg:py-24",
          tone === "muted" ? "bg-secondary/40" : "bg-background",
          className,
        )}
        {...props}
      >
        <div className={cn("mx-auto px-6 lg:px-8", containerMap[container])}>
          {hasHeader && (
            <header
              className={cn(
                "mb-10 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:mb-12 sm:flex sm:flex-wrap sm:justify-between",
                centered && "sm:flex-col sm:items-center sm:text-center",
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-3",
                  centered && "max-w-2xl items-center text-center",
                )}
              >
                {eyebrow && (
                  <span className="text-eyebrow text-[color:var(--accent-3)]">{eyebrow}</span>
                )}
                {title && (
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {title}
                  </h2>
                )}
                {description && <p className="text-lede">{description}</p>}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </header>
          )}
          {children}
        </div>
      </section>
    );
  },
);
FeatureSection.displayName = "FeatureSection";

export type { FeatureGridProps, FeatureSectionProps };
