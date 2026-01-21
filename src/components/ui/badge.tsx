import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium bg-gradient-to-r backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#ff8a65]/30 from-[#ff8a65]/20 to-[#ff6f4a]/10 text-[#ff8a65]",
        secondary: "border-gray-300 from-gray-100 to-gray-50 text-gray-700",
        destructive: "border-red-300 from-red-50 to-red-100/50 text-red-900",
        outline: "text-[#1a1a1a] border-gray-200 bg-white/80",
        coral: "border-[#ff8a65]/30 from-[#ff8a65]/20 to-[#ff6f4a]/10 text-[#ff8a65]",
        lavender: "border-[#b8a0d6]/30 from-[#b8a0d6]/20 to-[#9b7ec4]/10 text-[#b8a0d6]",
        blue: "border-[#a8d8ea]/30 from-[#a8d8ea]/20 to-[#8bc9e0]/10 text-[#a8d8ea]",
        pink: "border-[#ffb5c5]/30 from-[#ffb5c5]/20 to-[#ff9fb3]/10 text-[#ffb5c5]",
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
