import React from "react";

interface SelectionOverlayProps {
  isSelected: boolean;
  typeName: string;
}

export default function SelectionOverlay({ isSelected, typeName }: SelectionOverlayProps) {
  return (
    <>
      {/* Selection Box */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-lg transition-all duration-150 ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2 z-10"
            : "ring-1 ring-transparent group-hover:ring-blue-500/30 z-0"
        }`}
      />

      {/* Type Badge */}
      <div
        className={`absolute -top-3 left-3 z-20 bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm transition-opacity pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {typeName}
      </div>

      {/* Resize Handles (Only show when selected, placeholder for future) */}
      {isSelected && (
        <>
          <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-ew-resize z-20" />
          <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-ew-resize z-20" />
          <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1/2 cursor-ns-resize z-20" />
        </>
      )}
    </>
  );
}
