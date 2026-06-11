"use client";

import React from "react";
import { useEditorStore } from "@/lib/editor-store";
import { findElement, getElementPath } from "@/lib/specMutations";
import { JsonRenderSpec } from "@/lib/types";
import PropsForm from "./PropsForm";
import CatalogPanel from "./CatalogPanel";
import { ChevronRight, Layers } from "lucide-react";

export default function PropsInspector() {
  const {
    parsedSpec,
    format,
    selectedElementId,
    selectElement,
  } = useEditorStore();

  // No selection → show catalog
  if (!selectedElementId || !parsedSpec) {
    return <CatalogPanel />;
  }

  const element = findElement(parsedSpec, format, selectedElementId);

  if (!element) {
    return <CatalogPanel />;
  }

  // Build breadcrumb path
  const path =
    format === "json-render"
      ? getElementPath(parsedSpec as JsonRenderSpec, format, selectedElementId)
      : [selectedElementId];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Properties
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            {element.type}
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap">
          {path.map((id, i) => (
            <React.Fragment key={id}>
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              )}
              <button
                onClick={() => selectElement(id)}
                className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                  id === selectedElementId
                    ? "text-blue-700 bg-blue-50 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {id}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Props Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <PropsForm
          componentType={element.type}
          props={element.props}
          elementId={selectedElementId}
        />
      </div>
    </div>
  );
}
