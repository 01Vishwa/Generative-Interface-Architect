"use client";

import React from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Clock, GitBranch, Rewind, FastForward, GitCommit } from "lucide-react";

export default function Timeline() {
  const {
    events,
    eventIndex,
    jumpToEvent,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo();
  
  const activeBranchId = useSpecStore((s) => s.activeBranchId);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-t border-white/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0e1a]/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Time-Travel Debugger</span>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Step Back"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Step Forward"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-medium">
            <GitBranch className="w-3 h-3" />
            {activeBranchId}
          </div>
        </div>
      </div>

      {/* Scrubber / Timeline view */}
      <div className="flex-1 overflow-x-auto p-4 flex items-center">
        <div className="relative flex items-center min-w-max h-12 px-8">
          {/* Base line */}
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2" />
          
          {/* Active line */}
          <div 
            className="absolute top-1/2 left-8 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-300"
            style={{ 
              width: events.length > 0 
                ? `${Math.max(0, (eventIndex + 1) / events.length * 100)}%` 
                : "0%" 
            }}
          />

          {/* Initial State Node */}
          <div 
            onClick={() => jumpToEvent(-1)}
            className="relative z-10 mr-12 group cursor-pointer"
          >
            <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
              eventIndex === -1 
                ? "bg-blue-500 ring-4 ring-blue-500/20" 
                : "bg-gray-500 group-hover:bg-gray-400"
            }`} />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-500">
              Initial State
            </div>
          </div>

          {/* Event Nodes */}
          {events.map((event, index) => {
            const isActive = index === eventIndex;
            const isPast = index <= eventIndex;
            
            return (
              <div 
                key={event.id}
                onClick={() => jumpToEvent(index)}
                className="relative z-10 w-16 flex justify-center group cursor-pointer"
              >
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  isActive ? "bg-blue-500 ring-4 ring-blue-500/20 scale-125" :
                  isPast ? "bg-blue-400" : "bg-gray-600 group-hover:bg-gray-500"
                }`} />
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/10 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
                  <div className="text-[10px] text-gray-300 font-medium">{event.type}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{new Date(event.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
