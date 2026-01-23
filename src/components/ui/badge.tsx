import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium bg-gradient-to-r backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // coral из дизайн-системы: #ff8a5b
        default: "border-coral/30 from-coral/20 to-coral/10 text-coral",
        secondary: "border-muted from-cloud to-cream text-muted-foreground",
        destructive: "border-destructive/30 from-destructive/10 to-destructive/5 text-destructive",
        outline: "text-ink border-border bg-white/80",
        // coral из дизайн-системы: #ff8a5b
        coral: "border-coral/30 from-coral/20 to-coral/10 text-coral",
        // lavender из дизайн-системы: #e4a5f0
        lavender: "border-lavender/30 from-lavender/20 to-lavender/10 text-lavender",
        // soft-blue из дизайн-системы: #47BDF7
        blue: "border-soft-blue/30 from-soft-blue/20 to-soft-blue/10 text-soft-blue",
        // soft-pink из дизайн-системы: #ffb5d5
        pink: "border-soft-pink/30 from-soft-pink/20 to-soft-pink/10 text-soft-pink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
