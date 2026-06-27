"use client";

import React from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { useLLMStore } from "@/lib/store/useLLMStore";
import { useSpecStore } from "@/lib/store/useSpecStore";
import {
  Clock, Keyboard, Share2, Download, Settings,
  ChevronDown, Sparkles, Undo2, Redo2, Timer,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const setExportModalOpen = useUIStore((s) => s.setExportModalOpen);
  const setShareModalOpen = useUIStore((s) => s.setShareModalOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setTimelineOpen = useUIStore((s) => s.setTimelineOpen);
  const timelineOpen = useUIStore((s) => s.timelineOpen);

  const format = useSpecStore((s) => s.format);
  const setFormat = useSpecStore((s) => s.setFormat);
  const canUndo = useSpecStore((s) => s.canUndo);
  const canRedo = useSpecStore((s) => s.canRedo);
  const undo = useSpecStore((s) => s.undo);
  const redo = useSpecStore((s) => s.redo);
  const events = useSpecStore((s) => s.events);

  const activePersonaId = useLLMStore((s) => s.activePersonaId);
  const personas = useLLMStore((s) => s.personas);
  const setActivePersona = useLLMStore((s) => s.setActivePersona);
  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#0a0e1a] via-[#111827] to-[#0a0e1a] text-white border-b border-white/5 shrink-0 backdrop-blur-xl">
      {/* ─── Left: Branding + Format ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 ring-1 ring-white/10">
              G
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#111827]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              GenUI Studio
            </h1>
          </div>
        </div>
        <span className="text-[10px] bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium border border-blue-500/20">
          v2.0
        </span>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Format tabs */}
        <div className="flex bg-white/5 backdrop-blur-sm p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => setFormat("json-render")}
            className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
              format === "json-render"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            json-render
          </button>
          <button
            onClick={() => setFormat("a2ui")}
            className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
              format === "a2ui"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            A2UI
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => canUndo() && undo()}
            disabled={!canUndo()}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => canRedo() && redo()}
            disabled={!canRedo()}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          {events.length > 0 && (
            <span className="text-[10px] text-gray-500 ml-1 tabular-nums">
              {events.length} edits
            </span>
          )}
        </div>
      </div>

      {/* ─── Center: Persona Selector ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
            <span className="text-sm">{activePersona.icon}</span>
            <span className="text-[11px] font-medium text-gray-300">
              {activePersona.name}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {/* Dropdown */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-2 space-y-0.5">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setActivePersona(persona.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    persona.id === activePersonaId
                      ? "bg-blue-500/10 text-blue-300"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{persona.icon}</span>
                  <div>
                    <div className="text-[12px] font-medium">{persona.name}</div>
                    <div className="text-[10px] text-gray-500">{persona.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right: Actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className={`p-1.5 rounded-md transition-all ${
            timelineOpen
              ? "text-blue-400 bg-blue-500/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          title="Time-Travel Timeline"
        >
          <Timer className="w-4 h-4" />
        </button>
        <button
          onClick={() => setHistoryOpen(true)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
          title="Version History"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={() => setShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
