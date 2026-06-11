"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { CatalogDefinition } from "@/lib/types";
import { X, AlertCircle, Check } from "lucide-react";

export default function ImportCatalogModal() {
  const { importCatalogOpen, setImportCatalogOpen, importCatalog } = useEditorStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!importCatalogOpen) return null;

  const handleImport = () => {
    setError(null);
    setSuccess(false);
    try {
      const parsed = JSON.parse(input);

      // Validate structure
      if (!parsed.components || typeof parsed.components !== "object") {
        throw new Error('Missing "components" object in catalog definition');
      }

      for (const [name, def] of Object.entries(parsed.components)) {
        const d = def as any;
        if (!d.description || typeof d.description !== "string") {
          throw new Error(`Component "${name}" missing "description" string`);
        }
        if (!d.props || typeof d.props !== "object") {
          throw new Error(`Component "${name}" missing "props" object`);
        }
        if (typeof d.hasChildren !== "boolean") {
          throw new Error(`Component "${name}" missing "hasChildren" boolean`);
        }
      }

      importCatalog(parsed as CatalogDefinition);
      setSuccess(true);
      setTimeout(() => {
        setImportCatalogOpen(false);
        setInput("");
        setSuccess(false);
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Import Custom Catalog
          </h3>
          <button
            onClick={() => {
              setImportCatalogOpen(false);
              setInput("");
              setError(null);
            }}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-500">
            Paste your catalog definition as JSON. It should have a{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">components</code>{" "}
            object where each component has{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">description</code>,{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">props</code>, and{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">hasChildren</code>.
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            placeholder='{ "components": { "MyWidget": { "description": "...", "props": {...}, "hasChildren": false } } }'
            className="w-full text-xs font-mono border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none resize-none bg-gray-50"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4 flex-shrink-0" />
              Catalog imported successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => {
              setImportCatalogOpen(false);
              setInput("");
              setError(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!input.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg transition-colors"
          >
            Import Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
