"use client";

import React, { useMemo, useState } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { diffLines } from "diff";
import { GitCompareArrows, ChevronDown } from "lucide-react";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: { left?: number; right?: number };
}

export default function DiffView() {
  const { events, eventIndex } = useUndoRedo();
  const irDocument = useSpecStore((s) => s.irDocument);
  const format = useSpecStore((s) => s.format);

  // State selectors for "from" and "to" event indices
  const [fromIndex, setFromIndex] = useState<number>(Math.max(0, eventIndex - 1));
  const [toIndex, setToIndex] = useState<number>(eventIndex);

  // Compute snapshots at "from" and "to" states by serializing the IR at those points
  const diffResult = useMemo(() => {
    if (events.length === 0 || !irDocument) return null;

    // We'll serialize the current IR to get "to" state
    // For "from" state, we need to reconstruct — but since event replay is expensive,
    // we'll use the event payloads to show a meaningful diff
    const fromEvent = fromIndex >= 0 ? events[fromIndex] : null;
    const toEvent = toIndex >= 0 ? events[toIndex] : null;

    const fromText = fromEvent
      ? JSON.stringify(fromEvent.payload, null, 2)
      : '{ "state": "initial" }';
    const toText = toEvent
      ? JSON.stringify(toEvent.payload, null, 2)
      : '{ "state": "initial" }';

    const changes = diffLines(fromText, toText);
    const lines: DiffLine[] = [];
    let leftLine = 1;
    let rightLine = 1;

    for (const change of changes) {
      const contentLines = change.value.split("\n").filter((l, i, arr) => 
        // Remove trailing empty line from split
        i < arr.length - 1 || l !== ""
      );

      for (const content of contentLines) {
        if (change.added) {
          lines.push({
            type: "added",
            content,
            lineNumber: { right: rightLine++ },
          });
        } else if (change.removed) {
          lines.push({
            type: "removed",
            content,
            lineNumber: { left: leftLine++ },
          });
        } else {
          lines.push({
            type: "unchanged",
            content,
            lineNumber: { left: leftLine++, right: rightLine++ },
          });
        }
      }
    }

    const additions = lines.filter((l) => l.type === "added").length;
    const deletions = lines.filter((l) => l.type === "removed").length;

    return { lines, additions, deletions };
  }, [events, fromIndex, toIndex, irDocument]);

  if (!diffResult || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <GitCompareArrows className="w-6 h-6 opacity-50" />
          <span>Make some edits to see diffs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header: From/To selectors */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-[#0a0e1a]/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <GitCompareArrows className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold uppercase tracking-wider">Diff View</span>
        </div>

        <div className="flex-1" />

        {/* From selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 uppercase">From:</span>
          <div className="relative">
            <select
              value={fromIndex}
              onChange={(e) => setFromIndex(Number(e.target.value))}
              className="appearance-none bg-white/5 border border-white/10 text-gray-300 text-[11px] pl-2 pr-6 py-1 rounded-md outline-none focus:border-blue-500/50"
            >
              <option value={-1}>Initial</option>
              {events.map((evt, i) => (
                <option key={evt.id} value={i}>
                  #{i + 1} {evt.type}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* To selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 uppercase">To:</span>
          <div className="relative">
            <select
              value={toIndex}
              onChange={(e) => setToIndex(Number(e.target.value))}
              className="appearance-none bg-white/5 border border-white/10 text-gray-300 text-[11px] pl-2 pr-6 py-1 rounded-md outline-none focus:border-blue-500/50"
            >
              <option value={-1}>Initial</option>
              {events.map((evt, i) => (
                <option key={evt.id} value={i}>
                  #{i + 1} {evt.type}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-emerald-400">+{diffResult.additions}</span>
          <span className="text-red-400">-{diffResult.deletions}</span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto font-mono text-[11px] leading-5">
        {diffResult.lines.map((line, i) => (
          <div
            key={i}
            className={`flex ${
              line.type === "added"
                ? "bg-emerald-500/10"
                : line.type === "removed"
                ? "bg-red-500/10"
                : ""
            }`}
          >
            {/* Left line number */}
            <div className="w-10 shrink-0 text-right pr-2 text-gray-600 select-none border-r border-white/5">
              {line.lineNumber.left ?? ""}
            </div>
            {/* Right line number */}
            <div className="w-10 shrink-0 text-right pr-2 text-gray-600 select-none border-r border-white/5">
              {line.lineNumber.right ?? ""}
            </div>
            {/* Indicator */}
            <div
              className={`w-5 shrink-0 text-center select-none ${
                line.type === "added"
                  ? "text-emerald-400"
                  : line.type === "removed"
                  ? "text-red-400"
                  : "text-gray-700"
              }`}
            >
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </div>
            {/* Content */}
            <div
              className={`flex-1 px-2 whitespace-pre ${
                line.type === "added"
                  ? "text-emerald-300"
                  : line.type === "removed"
                  ? "text-red-300"
                  : "text-gray-400"
              }`}
            >
              {line.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
