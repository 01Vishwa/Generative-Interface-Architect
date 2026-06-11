"use client";

import React from "react";
import { useEditorStore } from "@/lib/editor-store";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "Shift", "F"], action: "Format JSON" },
  { keys: ["Ctrl", "Z"], action: "Undo" },
  { keys: ["Ctrl", "Enter"], action: "Generate with AI" },
  { keys: ["Escape"], action: "Deselect component" },
  { keys: ["Delete"], action: "Remove selected component" },
  { keys: ["Ctrl", "S"], action: "Star current spec to history" },
  { keys: ["Ctrl", "E"], action: "Open export menu" },
  { keys: ["Ctrl", "/"], action: "Toggle catalog/inspector" },
  { keys: ["?"], action: "Show this help" },
];

export default function KeyboardShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useEditorStore();

  if (!shortcutsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="px-6 py-4 space-y-2">
          {SHORTCUTS.map(({ keys, action }) => (
            <div
              key={action}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-gray-600">{action}</span>
              <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-xs text-gray-300">+</span>}
                    <kbd className="min-w-[24px] text-center px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded border border-gray-200 shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[11px] text-gray-400 text-center">
            On macOS, use ⌘ instead of Ctrl
          </p>
        </div>
      </div>
    </div>
  );
}
