"use client";

import React, { useState } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { GitBranch, Plus, Check } from "lucide-react";

export default function BranchManager() {
  const branches = useSpecStore((s) => s.branches);
  const currentBranchId = useSpecStore((s) => s.currentBranchId);
  const switchBranch = useSpecStore((s) => s.switchBranch);
  const createBranch = useSpecStore((s) => s.createBranch);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      createBranch(newBranchName.trim());
      setNewBranchName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-white/5">
      <div className="p-3 border-b border-white/5 bg-[#0a0e1a]/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <GitBranch className="w-3.5 h-3.5" />
          Branches
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          title="Create Branch"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-2 p-2 bg-white/5 rounded-lg border border-blue-500/30">
            <input
              autoFocus
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Branch name..."
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={!newBranchName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium py-1 rounded transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] font-medium py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {Object.entries(branches).map(([id, branch]) => (
          <button
            key={id}
            onClick={() => switchBranch(id)}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
              currentBranchId === id
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                : "hover:bg-white/5 border border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <div>
              <div className="text-xs font-medium truncate max-w-[150px]">
                {branch.name}
              </div>
              <div className="text-[10px] opacity-60 mt-0.5">
                {branch.events.length} events
              </div>
            </div>
            {currentBranchId === id && <Check className="w-3 h-3" />}
          </button>
        ))}
      </div>
    </div>
  );
}
