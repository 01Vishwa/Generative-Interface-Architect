"use client";

import React from "react";
import { useRegistryStore } from "@/lib/store/useRegistryStore";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { Search, Plus, Layers, Package } from "lucide-react";

export default function ComponentRegistry() {
  const { entries, searchQuery, getFilteredEntries, setSearchQuery } = useRegistryStore();
  const insertComponent = useSpecStore((s) => s.insertComponent);

  const filtered = getFilteredEntries();

  // Group by tags
  const grouped = filtered.reduce((acc, entry) => {
    const tag = entry.definition.tags?.[0] || "General";
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(entry);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header & Search */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            Registry
          </div>
          <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            {filtered.length} components
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.entries(grouped).map(([tag, comps]) => (
          <div key={tag} className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {tag}
            </div>
            {comps.map((comp) => (
              <div
                key={comp.name}
                className="group flex flex-col p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                onClick={() => insertComponent(comp.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md">
                      <Layers className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                      {comp.name}
                    </span>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all"
                    title="Insert to Canvas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {comp.definition.description && (
                  <div className="mt-1.5 text-[10px] text-gray-500 line-clamp-2 pl-8">
                    {comp.definition.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No components found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
