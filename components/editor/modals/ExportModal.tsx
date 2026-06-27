"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import {
  exportJson,
  exportAsLLMPrompt,
  exportAsCatalogTs,
  exportAsJsonl,
  exportAsReactComponent,
} from "@/lib/exportUtils";
import { X, Copy, Check, Download, Share2 } from "lucide-react";

export default function ExportModal() {
  const { exportModalOpen, setExportModalOpen, rawText, format, catalog } = useEditorStore();
  const [activeTab, setActiveTab] = useState("json");
  const [copied, setCopied] = useState(false);

  if (!exportModalOpen) return null;

  const getExportContent = () => {
    switch (activeTab) {
      case "json": return exportJson(rawText);
      case "prompt": return exportAsLLMPrompt(catalog, format);
      case "catalog": return exportAsCatalogTs(catalog);
      case "jsonl": return exportAsJsonl(rawText);
      case "react": return exportAsReactComponent(rawText, format);
      default: return "";
    }
  };

  const content = getExportContent();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = "export.txt";
    if (activeTab === "json") filename = "spec.json";
    if (activeTab === "prompt") filename = "prompt.txt";
    if (activeTab === "catalog") filename = "catalog.ts";
    if (activeTab === "jsonl") filename = "spec.jsonl";
    if (activeTab === "react") filename = "Component.tsx";

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setExportModalOpen(false)}
      />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Export Spec
          </h2>
          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {[
            { id: "json", label: "JSON" },
            { id: "prompt", label: "LLM Prompt" },
            { id: "catalog", label: "Catalog (.ts)" },
            ...(format === "a2ui" ? [{ id: "jsonl", label: "JSONL" }] : []),
            { id: "react", label: "React Component" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="relative flex-1 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden group">
            <pre className="p-4 text-xs font-mono text-gray-800 dark:text-gray-300 h-full overflow-auto whitespace-pre-wrap break-words">
              {content}
            </pre>
            
            <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>
        </div>
      </div>
    </div>
  );
}
