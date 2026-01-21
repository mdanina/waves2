import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.95]",
  {
    variants: {
      variant: {
        // Primary - Dark pill (#1a1a1a background) - from source project
        default: "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        // Secondary - White/Glass pill - from source project
        secondary: "bg-white text-ink hover:bg-cloud shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        // Coral - from design system: #ff8a5b
        coral: "bg-coral text-white hover:bg-coral-light",
        // Yellow - from source project
        yellow: "bg-[#F3B83A] text-white hover:bg-[#FFD54F] shadow-md",
        // Honey - Primary action color (legacy compatibility)
        honey: "bg-honey text-ink hover:bg-honey-dark shadow-soft",
        // Black - from source project
        black: "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] shadow-sm",
        // Outline - from source project
        outline: "bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white",
        // Ghost
        ghost: "hover:bg-cloud/50 text-ink",
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
