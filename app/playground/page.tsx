"use client";

import React, { useEffect } from "react";
import SpecEditor from "@/components/editor/SpecEditor";
import VisualCanvas from "@/components/editor/VisualCanvas";
import PropsInspector from "@/components/editor/PropsInspector";
import PromptBar from "@/components/editor/PromptBar";
import ExportMenu from "@/components/editor/ExportMenu";
import HistorySidebar from "@/components/editor/HistorySidebar";
import ImportCatalogModal from "@/components/editor/modals/ImportCatalogModal";
import ApiKeyModal from "@/components/editor/modals/ApiKeyModal";
import KeyboardShortcutsModal from "@/components/editor/modals/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useEditorStore } from "@/lib/editor-store";
import { saveSnapshot } from "@/lib/history";
import { decodeShareUrl } from "@/lib/exportUtils";
import { Clock, Keyboard, Sparkles } from "lucide-react";

export default function PlaygroundPage() {
  useKeyboardShortcuts();

  const {
    rawText,
    parsedSpec,
    format,
    generationError,
    setRawText,
    setParsedSpec,
    setFormat,
    setHistoryOpen,
    setShortcutsOpen,
  } = useEditorStore();

  const { ratio, containerRef, onMouseDown } = useResizablePanel(22, 75);

  // ─── Load from share URL on mount ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("share");
    if (shareParam) {
      const decoded = decodeShareUrl(shareParam);
      if (decoded) {
        setFormat(decoded.format);
        setRawText(decoded.spec);
        try {
          setParsedSpec(JSON.parse(decoded.spec));
        } catch {
          setParsedSpec(null);
        }
        // Clean URL
        window.history.replaceState({}, "", "/playground");
      }
    }
  }, [setFormat, setRawText, setParsedSpec]);

  // ─── Auto-save snapshots on valid spec changes ─────────────────────────
  useEffect(() => {
    if (!parsedSpec) return;
    const timer = setTimeout(() => {
      saveSnapshot(rawText, format, parsedSpec);
    }, 2000);
    return () => clearTimeout(timer);
  }, [rawText, format, parsedSpec]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20">
            G
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              GenUI Playground
            </h1>
          </div>
          <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full ml-1 font-medium">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Version History (Ctrl+/)"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <ExportMenu />
        </div>
      </header>

      {/* ─── Prompt Bar ───────────────────────────────────────────────────── */}
      <PromptBar />

      {/* Generation error */}
      {generationError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">Error:</span> {generationError}
        </div>
      )}

      {/* ─── Main 3-Pane Layout ───────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden relative"
      >
        {/* Left: Monaco Editor */}
        <div
          className="flex flex-col min-w-[280px] border-r border-gray-200 overflow-hidden"
          style={{ width: `${ratio}%` }}
        >
          <SpecEditor />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 relative z-10 group"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-300 group-hover:bg-blue-500 rounded-full transition-colors" />
        </div>

        {/* Right: Canvas + Inspector */}
        <div
          className="flex flex-col min-w-[280px] overflow-hidden"
          style={{ width: `${100 - ratio}%` }}
        >
          {/* Canvas (top ~60%) */}
          <div className="flex-[6] overflow-hidden flex flex-col border-b border-gray-200">
            <VisualCanvas />
          </div>

          {/* Inspector/Catalog (bottom ~40%) */}
          <div className="flex-[4] overflow-hidden">
            <PropsInspector />
          </div>
        </div>
      </div>

      {/* ─── Modals & Overlays ────────────────────────────────────────────── */}
      <HistorySidebar />
      <ImportCatalogModal />
      <ApiKeyModal />
      <KeyboardShortcutsModal />
    </div>
  );
}
