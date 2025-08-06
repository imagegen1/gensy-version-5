"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BeamsBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "subtle" | "medium" | "strong";
}

export const BeamsBackground = React.forwardRef<
  HTMLDivElement,
  BeamsBackgroundProps
>(({ className, children, intensity = "medium", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ backgroundColor: '#050913' }}
      {...props}
    >
      {/* Animated beams background */}
      <div className="absolute inset-0">
        {/* Multiple animated beam layers with stronger opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/15 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-500/15 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/15 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-teal-500/15 to-transparent animate-pulse" style={{ animationDelay: '4s' }} />

        {/* More prominent moving beams */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent animate-pulse" />
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-blue-400/40 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-purple-400/40 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        {/* Stronger diagonal beams */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-blue-500/20 via-transparent to-transparent" />
        </div>

        {/* Additional atmospheric effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse" style={{ animationDelay: '4.5s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

BeamsBackground.displayName = "BeamsBackground";
