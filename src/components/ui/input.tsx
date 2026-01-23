import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border-2 border-muted bg-white/80 backdrop-blur-sm px-4 py-3 text-base font-sans ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-coral-light transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
          className,
        )}
        style={isFocused ? {
          boxShadow: '0 0 0 3px rgba(255, 178, 153, 0.2), 0 10px 25px -5px rgba(255, 178, 153, 0.5), 0 4px 6px -2px rgba(255, 178, 153, 0.3)'
        } : { boxShadow: 'none' }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
