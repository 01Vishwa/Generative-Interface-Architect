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
import Editor from "@monaco-editor/react";
import { useUIStore } from "@/lib/store/useUIStore";

export default function ExportModal() {
  const { exportModalOpen, setExportModalOpen, rawText, format, catalog } = useEditorStore();
  const theme = useUIStore((s) => s.theme);
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
        <div className="flex px-6 pt-5 pb-3">
          <div className="flex p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl overflow-x-auto w-full shadow-inner border border-gray-200/50 dark:border-gray-700/50">
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
                className={`flex-1 min-w-[120px] px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 flex-1 overflow-hidden flex flex-col min-h-[400px]">
          <div className="relative flex-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner group">
            <Editor
              height="100%"
              language={
                activeTab === "json" || activeTab === "jsonl"
                  ? "json"
                  : activeTab === "prompt"
                  ? "markdown"
                  : "typescript"
              }
              value={content}
              theme={theme === "dark" ? "vs-dark" : "vs-light"}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                wordWrap: activeTab === "prompt" ? "on" : "off",
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: activeTab === "prompt" ? "off" : "on",
                renderLineHighlight: "none",
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium">
            Format: <span className="uppercase text-gray-900 dark:text-gray-300">{format}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                copied 
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
