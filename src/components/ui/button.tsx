import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-extrabold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary - Dark pill (Ink background)
        default: "bg-ink text-white hover:bg-[#2a1010] shadow-soft",
        // Secondary - White/Glass pill
        secondary: "bg-white text-ink hover:shadow-glass shadow-soft",
        // Honey - Primary action color
        honey: "bg-honey text-ink hover:bg-honey-dark shadow-soft",
        // Ghost
        ghost: "hover:bg-cloud/50 text-ink",
        // Outline
        outline: "border border-border bg-background hover:bg-cloud hover:text-ink",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Link
        link: "text-honey underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-4 text-lg",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
