"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { getApiKey, setApiKey as saveApiKey } from "@/lib/history";
import { X, Key, AlertCircle } from "lucide-react";

export default function ApiKeyModal() {
  const { apiKeyModalOpen, setApiKeyModalOpen } = useEditorStore();
  const [key, setKey] = useState(() => getApiKey());
  const [saved, setSaved] = useState(false);

  if (!apiKeyModalOpen) return null;

  const handleSave = () => {
    saveApiKey(key.trim());
    setSaved(true);
    setTimeout(() => {
      setApiKeyModalOpen(false);
      setSaved(false);
    }, 800);
  };

  const handleClear = () => {
    setKey("");
    saveApiKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">
              GitHub Token
            </h3>
          </div>
          <button
            onClick={() => setApiKeyModalOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            Enter your GitHub Personal Access Token for AI generation via GitHub Models.
            The token is stored only in your browser&apos;s localStorage.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Token
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="github_pat_..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all font-mono"
            />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Get a token from{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                github.com/settings/tokens
              </a>
              . Your token never leaves your browser except to call the GitHub Models API.
            </span>
          </div>

          {saved && (
            <div className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-center">
              ✓ Token saved
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear Token
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setApiKeyModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
