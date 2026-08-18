"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card text-card-foreground p-6 shadow-card will-change-transform transform-gpu transition-transform [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:transition-none motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-border rounded-b-xl data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t border-border rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Override swipe-to-close tuning. Merges with `DEFAULT_SHEET_SWIPE`. */
  swipe?: Partial<SheetSwipeConfig>;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, swipe, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SwipeableSheetContent
      ref={ref}
      side={side ?? "right"}
      className={className}
      swipe={swipe}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground cursor-pointer transition-colors hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SwipeableSheetContent>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

/**
 * Wraps Radix Dialog Content with a horizontal/vertical swipe-to-dismiss
 * gesture for touch (and pen) devices. The Radix-driven open/close slide
 * animation is preserved because we only apply an inline transform while a
 * pointer is actively dragging, and clear it on release so the CSS
 * transition takes over.
 */

/**
 * Tunable thresholds for the swipe-to-close gesture. Values are picked to
 * feel native on both iOS Safari (which rewards quick flicks) and Android
 * Chrome (which leans on travel distance). Override per-instance via the
 * `swipe` prop on `SheetContent`.
 */
export interface SheetSwipeConfig {
  /** Pixels the pointer must travel along the close axis before the gesture activates. */
  activationDistance: number;
  /** Pixels of travel toward the close edge that will dismiss on release. */
  closeDistance: number;
  /** Pointer velocity (px/ms) along the close axis that will dismiss on release, regardless of distance. */
  closeVelocity: number;
  /** Resistance divisor when dragging away from the close edge (1 = none, higher = stiffer). */
  resistance: number;
  /** If the orthogonal-axis travel exceeds primary-axis travel by this ratio, abandon the gesture (lets vertical scroll win). */
  scrollLockRatio: number;
  /** Disable the gesture entirely. */
  disabled?: boolean;
}

export const DEFAULT_SHEET_SWIPE: SheetSwipeConfig = {
  activationDistance: 10,
  closeDistance: 72,
  closeVelocity: 0.45,
  resistance: 4,
  scrollLockRatio: 1.2,
  disabled: false,
};

type SwipeableProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side: NonNullable<VariantProps<typeof sheetVariants>["side"]>;
  swipe?: Partial<SheetSwipeConfig>;
};

const SwipeableSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SwipeableProps
>(
  (
    {
      side,
      className,
      style,
      swipe,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) => {
    const cfg = React.useMemo<SheetSwipeConfig>(
      () => ({ ...DEFAULT_SHEET_SWIPE, ...swipe }),
      [swipe],
    );
    const innerRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    const drag = React.useRef<{
      id: number;
      startX: number;
      startY: number;
      startT: number;
      axis: "x" | "y";
      delta: number;
      active: boolean;
    } | null>(null);

    const axis: "x" | "y" = side === "left" || side === "right" ? "x" : "y";
    // Direction in which a swipe should dismiss the sheet (matches its edge).
    const closeSign = side === "right" || side === "bottom" ? 1 : -1;

    const applyTransform = (delta: number) => {
      const node = innerRef.current;
      if (!node) return;
      const translate =
        axis === "x" ? `translate3d(${delta}px,0,0)` : `translate3d(0,${delta}px,0)`;
      node.style.transform = translate;
      node.style.transition = "none";
    };

    const clearTransform = () => {
      const node = innerRef.current;
      if (!node) return;
      node.style.transform = "";
      node.style.transition = "";
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      if (cfg.disabled || e.pointerType === "mouse") return;
      // Don't hijack scroll/typing on interactive descendants.
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      drag.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startT: performance.now(),
        axis,
        delta: 0,
        active: false,
      };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(e);
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const primary = axis === "x" ? dx : dy;
      const secondary = axis === "x" ? dy : dx;
      if (!d.active) {
        if (Math.abs(primary) < cfg.activationDistance) return;
        // If user is mostly scrolling along the orthogonal axis, abandon the gesture.
        if (Math.abs(secondary) > Math.abs(primary) * cfg.scrollLockRatio) {
          drag.current = null;
          return;
        }
        d.active = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      // Only allow dragging toward the close edge; add resistance the other way.
      const toward = primary * closeSign;
      d.delta = toward > 0 ? toward : toward / Math.max(cfg.resistance, 1);
      applyTransform(d.delta * closeSign);
      e.preventDefault();
    };

    const finish = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Pointer capture may already be released; nothing to recover.
      }
      if (!d.active) return;
      const elapsed = Math.max(performance.now() - d.startT, 1);
      const velocity = d.delta / elapsed;
      const shouldClose = d.delta > cfg.closeDistance || velocity > cfg.closeVelocity;
      clearTransform();
      if (shouldClose) {
        // Click the built-in close button so Radix runs its normal close
        // pipeline (state change + slide-out animation from the edge).
        requestAnimationFrame(() => {
          const closeBtn = innerRef.current?.querySelector<HTMLButtonElement>(
            '[data-radix-collection-item], button[type="button"]',
          );
          const fallback = innerRef.current?.querySelector<HTMLButtonElement>(
            "button.absolute.right-4.top-4",
          );
          (fallback ?? closeBtn)?.click();
        });
      }
    };

    return (
      <SheetPrimitive.Content
        ref={setRefs}
        className={cn(sheetVariants({ side }), "touch-pan-y", className)}
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finish}
        onPointerCancel={(e) => {
          onPointerCancel?.(e);
          if (drag.current?.id === e.pointerId) {
            drag.current = null;
            clearTransform();
          }
        }}
        {...props}
      />
    );
  },
);
SwipeableSheetContent.displayName = "SwipeableSheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("font-display text-lg font-semibold leading-tight text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-label text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
