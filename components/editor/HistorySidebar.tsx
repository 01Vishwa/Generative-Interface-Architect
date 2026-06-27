"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { undoManager } from "@/lib/crdt";
import { X, Clock, RotateCcw, RotateCw } from "lucide-react";

export default function HistorySidebar() {
  const { historyOpen, setHistoryOpen } = useEditorStore();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historySize, setHistorySize] = useState(0);

  useEffect(() => {
    if (historyOpen) {
      const updateUndoState = () => {
        setCanUndo(undoManager.undoStack.length > 0);
        setCanRedo(undoManager.redoStack.length > 0);
        setHistorySize(undoManager.undoStack.length);
      };

      undoManager.on("stack-item-added", updateUndoState);
      undoManager.on("stack-item-popped", updateUndoState);
      updateUndoState();

      return () => {
        undoManager.off("stack-item-added", updateUndoState);
        undoManager.off("stack-item-popped", updateUndoState);
      };
    }
  }, [historyOpen]);

  if (!historyOpen) return null;

  const handleUndo = () => undoManager.undo();
  const handleRedo = () => undoManager.redo();

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/20 backdrop-blur-sm"
        onClick={() => setHistoryOpen(false)}
      />

      {/* Sidebar */}
      <div className="w-80 bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              CRDT History
            </h2>
            <span className="text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {historySize}
            </span>
          </div>
          <button
            onClick={() => setHistoryOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Snapshot list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Version history is now managed collaboratively using Yjs and Supabase.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canUndo
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canRedo
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RotateCw className="w-4 h-4" />
              Redo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
