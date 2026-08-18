import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SegmentedControl — RTO Radar tab / view switcher.
 *
 * Flat, evidence-oriented control: a thin hairline track with a single
 * navy active segment. Use for switching between article views, tabs, or
 * small filter sets (2–5 options). For anything larger, use a real tab
 * component.
 *
 * ```tsx
 * <SegmentedControl
 *   value={view}
 *   onValueChange={setView}
 *   options={[
 *     { value: "article", label: "Article" },
 *     { value: "related", label: "Related" },
 *   ]}
 * />
 * ```
 */
export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Optional element rendered before the label (icon or badge). */
  icon?: React.ReactNode;
  /** Rendered muted after the label (count, chip). */
  hint?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const btnSize = size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-5 text-sm";
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-brand border border-brand-hairline",
        "bg-brand-surface-alt p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`seg-${opt.value}`}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onValueChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[6px]",
              "font-medium tracking-tight transition-colors duration-150",
              btnSize,
              active
                ? "bg-brand-navy text-brand-on-navy"
                : "text-brand-muted hover:text-brand-ink hover:bg-brand-surface",
              opt.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.hint != null && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/15 text-white" : "bg-brand-sky-soft text-brand-sky",
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
