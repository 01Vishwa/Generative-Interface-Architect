"use client";

import React from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { List, ArrowUpCircle, ArrowDownCircle, Edit3, PlusCircle, Trash2 } from "lucide-react";

export default function EventLog() {
  const events = useSpecStore((s) => s.events);
  const eventIndex = useSpecStore((s) => s.eventIndex);
  const jumpToEvent = useSpecStore((s) => s.jumpToEvent);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "INIT": return <List className="w-3.5 h-3.5 text-gray-500" />;
      case "INSERT": return <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case "UPDATE": return <Edit3 className="w-3.5 h-3.5 text-blue-500" />;
      case "DELETE": return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
      case "MOVE": return <ArrowUpCircle className="w-3.5 h-3.5 text-purple-500" />;
      default: return <List className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-white/5">
      <div className="p-3 border-b border-white/5 bg-[#0a0e1a]/50 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <List className="w-3.5 h-3.5" />
        Event Log
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => jumpToEvent(-1)}
          className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all ${
            eventIndex === -1
              ? "bg-blue-500/10 text-white"
              : "hover:bg-white/5 text-gray-400"
          }`}
        >
          <div className="mt-0.5">
            <List className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div>
            <div className="text-xs font-medium">Initial State</div>
            <div className="text-[10px] opacity-60 mt-0.5">Start of branch</div>
          </div>
        </button>

        {events.map((event, index) => {
          const isActive = index === eventIndex;
          const isUndone = index > eventIndex;
          
          return (
            <button
              key={event.id}
              onClick={() => jumpToEvent(index)}
              className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all ${
                isActive
                  ? "bg-blue-500/10 border border-blue-500/20 text-white"
                  : isUndone
                  ? "opacity-40 hover:opacity-70 hover:bg-white/5 text-gray-400"
                  : "hover:bg-white/5 text-gray-300"
              }`}
            >
              <div className="mt-0.5">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium truncate">{event.description}</div>
                  <div className="text-[9px] text-gray-500 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 truncate font-mono">
                  {event.type}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
