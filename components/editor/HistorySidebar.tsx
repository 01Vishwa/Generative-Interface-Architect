"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import {
  loadSnapshots,
  starSnapshot,
  deleteSnapshot,
  relativeTime,
} from "@/lib/history";
import { HistorySnapshot } from "@/lib/types";
import { X, Star, Trash2, Clock, RotateCcw } from "lucide-react";

export default function HistorySidebar() {
  const { historyOpen, setHistoryOpen, setRawText, setParsedSpec, format } =
    useEditorStore();
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);

  useEffect(() => {
    if (historyOpen) {
      setSnapshots(loadSnapshots());
    }
  }, [historyOpen]);

  if (!historyOpen) return null;

  const handleRestore = (snapshot: HistorySnapshot) => {
    if (!confirm("Restore this snapshot? Current changes will be replaced.")) return;
    setRawText(snapshot.text);
    try {
      setParsedSpec(JSON.parse(snapshot.text));
    } catch {
      setParsedSpec(null);
    }
  };

  const handleStar = (id: string, starred: boolean) => {
    const updated = starSnapshot(id, starred);
    setSnapshots(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

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
              Version History
            </h2>
            <span className="text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {snapshots.length}
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
        <div className="flex-1 overflow-y-auto">
          {snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Clock className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No snapshots yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Snapshots are saved automatically when you make valid changes
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="group bg-white border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-700">
                          {relativeTime(snap.timestamp)}
                        </span>
                        {snap.starred && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {snap.componentCount} components
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">
                          {formatBytes(snap.byteSize)}
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {snap.format}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(snap)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Restore this snapshot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStar(snap.id, !snap.starred)}
                        className={`p-1 rounded transition-colors ${
                          snap.starred
                            ? "text-amber-400 hover:bg-amber-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={snap.starred ? "Unstar" : "Star"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${snap.starred ? "fill-amber-400" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
