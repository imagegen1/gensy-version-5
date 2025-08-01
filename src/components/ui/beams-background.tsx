"use client";

import { cn } from "@/lib/utils";
import React, { useRef } from "react";

export const BeamsBackground = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const beamsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >


      {/* Animated beams overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-500/10 to-transparent animate-pulse delay-2000" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

BeamsBackground.displayName = "BeamsBackground";
