import type * as React from "react";

import { cn } from "@/lib/utils";

interface CapabilityContentShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function CapabilityContentShell({
  children,
  className,
  contentClassName,
}: CapabilityContentShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col px-4 py-6 sm:px-6", className)}>
      <div className={cn("mx-auto w-full max-w-4xl", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
