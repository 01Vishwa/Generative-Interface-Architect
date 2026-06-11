"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getSplitRatio, setSplitRatio } from "@/lib/history";

/**
 * Hook for a resizable split panel.
 * Returns the left panel width percentage and drag handlers.
 */
export function useResizablePanel(minPercent = 20, maxPercent = 80) {
  const [ratio, setRatio] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load saved ratio on mount
  useEffect(() => {
    const saved = getSplitRatio();
    if (saved >= minPercent && saved <= maxPercent) {
      setRatio(saved);
    }
  }, [minPercent, maxPercent]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      const clamped = Math.max(minPercent, Math.min(maxPercent, percent));
      setRatio(clamped);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setSplitRatio(ratio);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [ratio, minPercent, maxPercent]);

  return { ratio, containerRef, onMouseDown };
}
