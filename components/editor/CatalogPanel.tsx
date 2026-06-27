/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import { Search, Plus, Upload, Star } from "lucide-react";

export default function CatalogPanel() {
  const { catalog, insertElement, setImportCatalogOpen } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "custom">("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const activeCatalog = catalog || DEFAULT_CATALOG;

  const toggleFavorite = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredComponents = useMemo(() => {
    const entries = Object.entries(activeCatalog.components);
    
    let filtered = entries;
    if (activeTab === "favorites") {
      filtered = entries.filter(([name]) => favorites.has(name));
    } else if (activeTab === "custom") {
      // Mock custom components check: components not in DEFAULT_CATALOG
      filtered = entries.filter(([name]) => !(name in DEFAULT_CATALOG.components));
    }

    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter(
      ([name, def]) =>
        name.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q)
    );
  }, [activeCatalog, searchQuery, activeTab, favorites]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Component Registry
          </h2>
          <button
            onClick={() => setImportCatalogOpen(true)}
            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Import custom components"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-lg mb-3">
          {[{ id: "all", label: "All" }, { id: "favorites", label: "Favs" }, { id: "custom", label: "Custom" }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.map(([name, def]) => (
          <div
            key={name}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-sm transition-all group relative"
          >
            <button 
              onClick={() => toggleFavorite(name)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Star className={`w-3.5 h-3.5 ${favorites.has(name) ? 'fill-amber-400 text-amber-400 opacity-100' : 'text-gray-400 hover:text-amber-400'}`} />
            </button>

            <div className="flex items-start justify-between pr-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</h3>
                  <span className="text-[9px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1 py-0.5 rounded">v1.0.0</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {def.description}
                </p>
              </div>
            </div>

            {/* Prop list */}
            {Object.keys(def.props).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(def.props).map(([propName, propDef]) => (
                  <span
                    key={propName}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      propDef.required
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                    }`}
                    title={`${propDef.type}${propDef.required ? " (required)" : ""}`}
                  >
                    {propName}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              {def.hasChildren ? (
                <span className="inline-block text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                  ↳ accepts children
                </span>
              ) : <div />}
              
              <button
                onClick={() => insertElement(name)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                Insert
              </button>
            </div>
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
