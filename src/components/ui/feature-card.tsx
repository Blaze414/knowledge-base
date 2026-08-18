import * as React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Icon container tone — defaults to pale blue per brand guideline. */
  tone?: React.ComponentProps<typeof IconTile>["tone"];
  /** Optional call-to-action rendered as a subtle link row. */
  cta?: { label: string; to?: string; href?: string; onClick?: () => void };
  /** Layout: stacked (icon above copy) or inline (icon beside copy). */
  layout?: "stacked" | "inline";
  className?: string;
  children?: React.ReactNode;
};

/**
 * Feature tile matching the RTO Radar guideline:
 *  - White card, thin border, 12px rounding, soft shadow that lifts on hover
 *  - Pale-blue IconTile with a line icon
 *  - Rubik title, muted body copy, optional coral-tinted CTA row
 */
export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    { icon: Icon, title, description, tone = "blue", cta, layout = "stacked", className, children },
    ref,
  ) => {
    const inline = layout === "inline";
    return (
      <Card
        ref={ref}
        className={cn(
          "group flex flex-col gap-4 p-6",
          inline && "sm:flex-row sm:items-start sm:gap-5",
          className,
        )}
      >
        <IconTile tone={tone} size="lg" shape="rounded" className="shrink-0">
          <Icon aria-hidden="true" />
        </IconTile>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {children}
          {cta && <FeatureCardCta {...cta} />}
        </div>
      </Card>
    );
  },
);
FeatureCard.displayName = "FeatureCard";

function FeatureCardCta({ label, to, href, onClick }: NonNullable<FeatureCardProps["cta"]>) {
  const content = (
    <>
      <span>{label}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </>
  );
  const className =
    "mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--accent-3)] transition-colors hover:text-[color:var(--accent-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded";

  if (to)
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export type { FeatureCardProps };
