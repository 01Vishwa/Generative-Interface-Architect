"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import {
  exportJson,
  exportAsLLMPrompt,
  exportAsCatalogTs,
  exportAsJsonl,
  exportAsShareUrl,
  exportAsReactComponent,
} from "@/lib/exportUtils";
import {
  Download,
  Copy,
  FileCode2,
  Link,
  MessageSquare,
  Component,
  FileJson,
  Check,
} from "lucide-react";

export default function ExportMenu() {
  const { rawText, format, catalog } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const items = [
    {
      label: "Copy JSON",
      icon: Copy,
      action: () => copyToClipboard(exportJson(rawText), "Copy JSON"),
    },
    {
      label: "Copy as LLM Prompt",
      icon: MessageSquare,
      action: () =>
        copyToClipboard(exportAsLLMPrompt(catalog, format), "Copy as LLM Prompt"),
    },
    {
      label: "Export Catalog (.ts)",
      icon: FileCode2,
      action: () => downloadFile(exportAsCatalogTs(catalog), "catalog.ts"),
    },
    ...(format === "a2ui"
      ? [
          {
            label: "Export as JSONL",
            icon: FileJson,
            action: () =>
              downloadFile(exportAsJsonl(rawText), "spec.jsonl"),
          },
        ]
      : []),
    {
      label: "Share via URL",
      icon: Link,
      action: () => {
        const url = exportAsShareUrl(rawText, format);
        if (rawText.length > 8192) {
          alert("Spec is larger than 8KB — URL sharing may not work in all browsers.");
        }
        copyToClipboard(url, "Share via URL");
      },
    },
    {
      label: "Copy React Component",
      icon: Component,
      action: () =>
        copyToClipboard(
          exportAsReactComponent(rawText, format),
          "Copy React Component"
        ),
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
          {items.map((item) => {
            const Icon = item.icon;
            const isCopied = copied === item.label;

            return (
              <button
                key={item.label}
                onClick={() => {
                  item.action();
                  if (!item.label.includes("Export")) {
                    // Don't close for downloads
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Icon className="w-4 h-4 text-gray-400" />
                )}
                <span className={isCopied ? "text-emerald-600" : ""}>
                  {isCopied ? "Copied!" : item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
