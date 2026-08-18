import * as React from "react";
import { cn } from "@/lib/utils";

type IconTileProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
  shape?: "square" | "rounded";
  tone?: "blue" | "coral" | "navy" | "amber";
};

const sizeMap = {
  sm: "h-8 w-8 [&_svg]:size-4",
  md: "h-10 w-10 [&_svg]:size-5",
  lg: "h-12 w-12 [&_svg]:size-6",
};

const toneMap: Record<NonNullable<IconTileProps["tone"]>, string> = {
  blue: "bg-[color:var(--accent-3)]/10 text-[color:var(--accent-3)]",
  coral: "bg-[color:var(--accent-2)]/10 text-[color:var(--accent-2)]",
  navy: "bg-primary/10 text-primary",
  amber: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
};

/**
 * Pale-tinted square/rounded container for a single line icon.
 * Use to wrap a lucide-react icon (stroke inherits currentColor).
 */
export const IconTile = React.forwardRef<HTMLDivElement, IconTileProps>(
  ({ className, size = "md", shape = "rounded", tone = "blue", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        shape === "rounded" ? "rounded-lg" : "rounded-md",
        sizeMap[size],
        toneMap[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
IconTile.displayName = "IconTile";
