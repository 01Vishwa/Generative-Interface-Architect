import React, { useRef, useEffect } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";

interface SelectionOverlayProps {
  isSelected: boolean;
  typeName: string;
  nodeId: string;
}

export default function SelectionOverlay({ isSelected, typeName, nodeId }: SelectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const updateProps = useSpecStore((s) => s.updateProps);

  // Drag state refs to avoid re-renders during active drag
  const dragRef = useRef<{
    active: boolean;
    type: "east" | "west" | "south" | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    targetEl: HTMLElement | null;
  }>({
    active: false,
    type: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    targetEl: null,
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state.active || !state.targetEl) return;
      e.preventDefault();

      if (state.type === "east") {
        const newWidth = Math.max(50, state.startWidth + (e.clientX - state.startX));
        state.targetEl.style.width = `${newWidth}px`;
      } else if (state.type === "west") {
        const newWidth = Math.max(50, state.startWidth - (e.clientX - state.startX));
        state.targetEl.style.width = `${newWidth}px`;
      } else if (state.type === "south") {
        const newHeight = Math.max(20, state.startHeight + (e.clientY - state.startY));
        state.targetEl.style.height = `${newHeight}px`;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state.active) return;
      state.active = false;
      document.body.style.cursor = "";
      
      if (state.targetEl) {
        const finalWidth = state.targetEl.style.width;
        const finalHeight = state.targetEl.style.height;
        
        // Commit to store
        if (state.type === "east" || state.type === "west") {
          updateProps(nodeId, { width: finalWidth });
        } else if (state.type === "south") {
          updateProps(nodeId, { height: finalHeight });
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [nodeId, updateProps]);

  const startDrag = (e: React.PointerEvent, type: "east" | "west" | "south") => {
    e.stopPropagation();
    e.preventDefault();
    
    // Find the actual rendered component.
    // containerRef.current is the overlay div itself.
    // Its parent is the NodeRenderer wrapper.
    // The component is the child of the wrapper that isn't the overlay.
    const wrapper = containerRef.current?.parentElement;
    if (!wrapper) return;
    
    // The rendered component is the last child of the wrapper
    const targetEl = wrapper.lastElementChild as HTMLElement;
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();

    dragRef.current = {
      active: true,
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      targetEl,
    };

    document.body.style.cursor = type === "south" ? "ns-resize" : "ew-resize";
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10">
      {/* Selection Box */}
      <div
        className={`absolute inset-0 rounded-lg transition-all duration-150 ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2"
            : "ring-1 ring-transparent group-hover:ring-blue-500/30"
        }`}
      />

      {/* Type Badge */}
      <div
        className={`absolute -top-3 left-3 bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {typeName}
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          <div 
            onPointerDown={(e) => startDrag(e, "west")}
            className="absolute top-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-ew-resize pointer-events-auto" 
          />
          <div 
            onPointerDown={(e) => startDrag(e, "east")}
            className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-ew-resize pointer-events-auto" 
          />
          <div 
            onPointerDown={(e) => startDrag(e, "south")}
            className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1/2 cursor-ns-resize pointer-events-auto" 
          />
        </>
      )}
    </div>
  );
}
