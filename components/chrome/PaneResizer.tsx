"use client";

import React from "react";

interface PaneResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  direction?: "horizontal" | "vertical";
}

export default function PaneResizer({
  onMouseDown,
  onKeyDown,
  direction = "horizontal",
}: PaneResizerProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      role="separator"
      tabIndex={0}
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      className={`
        relative group shrink-0 z-20
        ${isHorizontal
          ? "w-[3px] cursor-col-resize"
          : "h-[3px] cursor-row-resize"
        }
        bg-transparent hover:bg-blue-500/30
        transition-colors duration-150
      `}
    >
      {/* Hit area (larger than visual) */}
      <div
        className={`absolute ${
          isHorizontal
            ? "inset-y-0 -left-1.5 -right-1.5"
            : "inset-x-0 -top-1.5 -bottom-1.5"
        }`}
      />

      {/* Visual indicator */}
      <div
        className={`absolute ${
          isHorizontal
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-8"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] w-8"
        } bg-gray-600/40 group-hover:bg-blue-400 rounded-full transition-all duration-200 group-hover:scale-110`}
      />

      {/* Glow effect on hover */}
      <div
        className={`absolute opacity-0 group-hover:opacity-100 transition-opacity ${
          isHorizontal
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-16"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-16"
        } bg-blue-400/20 blur-sm rounded-full`}
      />
    </div>
  );
}
