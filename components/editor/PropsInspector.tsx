"use client";

import React from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { findSourceIdPath } from "@/lib/ir/selection";
import PropsForm from "./PropsForm";
// import ComponentRegistry from "./ComponentRegistry"; // Temporarily use empty state if null
import { ChevronRight, Layers } from "lucide-react";

export default function PropsInspector() {
  const irDocument = useSpecStore((s) => s.irDocument);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);
  const getSelectedNode = useSpecStore((s) => s.getSelectedNode);
  const getSelectedElement = useSpecStore((s) => s.getSelectedElement);

  const node = getSelectedNode();
  const legacyElement = getSelectedElement(); // For PropsForm compatibility

  // No selection → show registry placeholder
  if (!selectedNodeId || !irDocument || !node || !legacyElement) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
        <Layers className="w-10 h-10 text-gray-700 mb-3" />
        <h3 className="text-sm font-semibold text-gray-300">No Component Selected</h3>
        <p className="text-xs text-gray-500 mt-1">Select a component on the canvas to edit its properties.</p>
      </div>
    );
  }

  // Build breadcrumb path
  const path = findSourceIdPath(irDocument.root, selectedNodeId);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Properties
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
            {node.type}
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap">
          {path.map((sourceId, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
              )}
              <div
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  i === path.length - 1
                    ? "text-blue-400 bg-blue-500/10 font-medium"
                    : "text-gray-500"
                }`}
              >
                {sourceId}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Props Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <PropsForm
          componentType={node.type}
          props={legacyElement.props}
          elementId={selectedNodeId}
        />
      </div>
    </div>
  );
}
