import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-brand border border-transparent text-sm font-medium cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary — deep navy fill; hover deepens to navy-strong. */
        default:
          "bg-brand-navy text-brand-on-navy shadow-elev-1 hover:bg-brand-navy-strong hover:shadow-elev-focus active:shadow-inset-soft",
        /** Sky-blue primary CTA — professional support action. */
        cta: "bg-brand-sky text-brand-on-sky shadow-elev-1 hover:bg-brand-sky-hover hover:shadow-elev-focus active:bg-brand-sky-active active:shadow-inset-soft",
        /** Neutral — hairline card surface; hover lifts to soft navy tint. */
        neutral:
          "bg-transparent text-brand-ink border-brand-hairline hover:border-brand-muted hover:bg-brand-surface-alt active:shadow-inset-soft",
        /** Legacy alias — matches `neutral`. */
        outline:
          "bg-transparent text-brand-ink border-brand-hairline hover:border-brand-muted hover:bg-brand-surface-alt active:shadow-inset-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent active:shadow-inset-soft",
        ghost: "text-brand-ink hover:bg-brand-sky-soft hover:text-brand-ink hover:translate-y-0",
        link: "text-brand-sky underline-offset-4 hover:text-brand-coral hover:underline",
        brand:
          "bg-brand-coral text-brand-on-sky shadow-elev-1 hover:brightness-95 hover:shadow-elev-focus active:shadow-inset-soft",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elev-1 hover:shadow-elev-2 active:shadow-inset-soft",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-8 rounded-[6px] px-4 text-[13px]",
        lg: "h-12 rounded-brand px-8 text-[15px]",
        icon: "h-10 w-10 rounded-brand",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
