// ─── useResizable — Multi-Pane Resize Hook ───────────────────────────────────
// Supports 2+ resizable panes with min/max constraints and keyboard control.

import { useCallback, useRef, useState, useEffect } from "react";

export interface ResizableConfig {
  /** Number of panes */
  paneCount: number;
  /** Initial sizes as percentages (must sum to 100) */
  initialSizes: number[];
  /** Minimum size per pane (percentage) */
  minSize?: number;
  /** Maximum size per pane (percentage) */
  maxSize?: number;
  /** Orientation */
  direction?: "horizontal" | "vertical";
  /** Callback when sizes change */
  onResize?: (sizes: number[]) => void;
}

export function useResizable(config: ResizableConfig) {
  const {
    paneCount,
    initialSizes,
    minSize = 10,
    maxSize = 80,
    direction = "horizontal",
    onResize,
  } = config;

  const [sizes, setSizes] = useState<number[]>(initialSizes);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dividerIndex: number;
    startPos: number;
    startSizes: number[];
  } | null>(null);

  // ─── Mouse drag ────────────────────────────────────────────────────────
  const onDragStart = useCallback(
    (dividerIndex: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = direction === "horizontal" ? e.clientX : e.clientY;

      dragState.current = {
        dividerIndex,
        startPos,
        startSizes: [...sizes],
      };

      const onMouseMove = (me: MouseEvent) => {
        if (!dragState.current || !containerRef.current) return;

        const { dividerIndex, startPos, startSizes } = dragState.current;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerSize = direction === "horizontal"
          ? containerRect.width
          : containerRect.height;
        const currentPos = direction === "horizontal" ? me.clientX : me.clientY;
        const delta = ((currentPos - startPos) / containerSize) * 100;

        const newSizes = [...startSizes];
        const leftPane = dividerIndex;
        const rightPane = dividerIndex + 1;

        newSizes[leftPane] = Math.max(minSize, Math.min(maxSize, startSizes[leftPane] + delta));
        newSizes[rightPane] = Math.max(minSize, Math.min(maxSize, startSizes[rightPane] - delta));

        // Ensure total stays at 100
        const total = newSizes.reduce((a, b) => a + b, 0);
        if (Math.abs(total - 100) > 0.1) return;

        setSizes(newSizes);
        onResize?.(newSizes);
      };

      const onMouseUp = () => {
        dragState.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [sizes, direction, minSize, maxSize, onResize]
  );

  // ─── Keyboard resize ──────────────────────────────────────────────────
  const onDividerKeyDown = useCallback(
    (dividerIndex: number) => (e: React.KeyboardEvent) => {
      const step = 2; // 2% per keypress
      let delta = 0;

      if (direction === "horizontal") {
        if (e.key === "ArrowLeft") delta = -step;
        if (e.key === "ArrowRight") delta = step;
      } else {
        if (e.key === "ArrowUp") delta = -step;
        if (e.key === "ArrowDown") delta = step;
      }

      if (delta === 0) return;
      e.preventDefault();

      setSizes((prev) => {
        const newSizes = [...prev];
        const leftPane = dividerIndex;
        const rightPane = dividerIndex + 1;

        newSizes[leftPane] = Math.max(minSize, Math.min(maxSize, prev[leftPane] + delta));
        newSizes[rightPane] = Math.max(minSize, Math.min(maxSize, prev[rightPane] - delta));

        const total = newSizes.reduce((a, b) => a + b, 0);
        if (Math.abs(total - 100) > 0.1) return prev;

        onResize?.(newSizes);
        return newSizes;
      });
    },
    [direction, minSize, maxSize, onResize]
  );

  // ─── Collapse/expand ──────────────────────────────────────────────────
  const togglePane = useCallback(
    (paneIndex: number) => {
      setSizes((prev) => {
        const newSizes = [...prev];
        if (newSizes[paneIndex] <= minSize) {
          // Expand: restore to equal distribution
          const collapsed = newSizes.filter((_, i) => i !== paneIndex && newSizes[i] > minSize);
          const equalSize = 100 / paneCount;
          return newSizes.map(() => equalSize);
        } else {
          // Collapse: minimize this pane
          const freed = newSizes[paneIndex] - minSize;
          newSizes[paneIndex] = minSize;
          // Distribute freed space to other panes
          const otherPanes = newSizes.filter((_, i) => i !== paneIndex && newSizes[i] > minSize);
          const perPane = freed / otherPanes.length;
          return newSizes.map((size, i) => (i === paneIndex ? minSize : size + perPane));
        }
      });
    },
    [minSize, paneCount]
  );

  // ─── Reset to initial ─────────────────────────────────────────────────
  const resetSizes = useCallback(() => {
    setSizes(initialSizes);
    onResize?.(initialSizes);
  }, [initialSizes, onResize]);

  return {
    sizes,
    containerRef,
    onDragStart,
    onDividerKeyDown,
    togglePane,
    resetSizes,
    setSizes,
  };
}
