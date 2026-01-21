import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-2xl border-2 p-4 backdrop-blur-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 text-blue-900 [&>svg]:text-blue-500",
        destructive: "bg-gradient-to-r from-red-50 to-red-100/50 border-red-200 text-red-900 [&>svg]:text-red-500",
        success: "bg-gradient-to-r from-green-50 to-green-100/50 border-green-200 text-green-900 [&>svg]:text-green-500",
        warning: "bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-200 text-yellow-900 [&>svg]:text-yellow-500",
        info: "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 text-blue-900 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
