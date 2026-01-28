import * as React from "react";

import { cn } from "@/lib/utils";

type SectionContainerProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

/**
 * Consistent landing wrapper: gutters / centered content / gutters.
 * - Mobile: simple horizontal padding
 * - Desktop: 3-column grid with ~1200px center column
 */
export function SectionContainer({ children, className, innerClassName }: SectionContainerProps) {
  return (
    <div className={cn("w-full px-4 md:grid md:grid-cols-[1fr_minmax(0,1040px)_1fr]", className)}>
      <div className={cn("md:col-start-2", innerClassName)}>{children}</div>
    </div>
  );
}

