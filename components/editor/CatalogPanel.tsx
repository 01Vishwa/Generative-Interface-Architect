"use client";

import React, { useState, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import { Search, Plus, Upload } from "lucide-react";

export default function CatalogPanel() {
  const { catalog, insertElement, setImportCatalogOpen } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");

  const activeCatalog = catalog || DEFAULT_CATALOG;

  const filteredComponents = useMemo(() => {
    const entries = Object.entries(activeCatalog.components);
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      ([name, def]) =>
        name.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q)
    );
  }, [activeCatalog, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Component Catalog
          </h2>
          <button
            onClick={() => setImportCatalogOpen(true)}
            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
            title="Import custom catalog"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full text-xs bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.map(([name, def]) => (
          <div
            key={name}
            className="bg-white border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  {def.description}
                </p>
              </div>
              <button
                onClick={() => insertElement(name)}
                className="flex-shrink-0 ml-2 flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors opacity-70 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                Insert
              </button>
            </div>

            {/* Prop list */}
            {Object.keys(def.props).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(def.props).map(([propName, propDef]) => (
                  <span
                    key={propName}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      propDef.required
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    title={`${propDef.type}${propDef.required ? " (required)" : ""}`}
                  >
                    {propName}
                  </span>
                ))}
              </div>
            )}

            {def.hasChildren && (
              <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                ↳ accepts children
              </span>
            )}
          </div>
        ))}

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            No components match &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
