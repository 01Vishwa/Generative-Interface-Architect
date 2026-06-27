"use client";

import React, { useState, useCallback } from "react";
import { useRegistryStore } from "@/lib/store/useRegistryStore";
import type { DesignToken, TokenCategory } from "@/types/catalog";
import { Palette, Plus, Trash2, Copy, Check, Download } from "lucide-react";

const CATEGORY_LABELS: Record<TokenCategory, string> = {
  color: "Colors",
  spacing: "Spacing",
  typography: "Typography",
  shadow: "Shadows",
  radius: "Border Radius",
  border: "Borders",
};

const CATEGORY_ICONS: Record<TokenCategory, string> = {
  color: "🎨",
  spacing: "📐",
  typography: "🔤",
  shadow: "🌫",
  radius: "◻️",
  border: "🔲",
};

export default function DesignTokenEditor() {
  const { tokens, addToken, removeToken, updateToken } = useRegistryStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newToken, setNewToken] = useState<Partial<DesignToken>>({
    category: "color",
    name: "",
    value: "#3b82f6",
    cssVariable: "",
    label: "",
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Group tokens by category
  const grouped = tokens.tokens.reduce((acc, token) => {
    if (!acc[token.category]) acc[token.category] = [];
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, DesignToken[]>);

  const handleAddToken = useCallback(() => {
    if (!newToken.name || !newToken.value) return;

    const cssVar = newToken.cssVariable || `--${newToken.name.replace(/\./g, "-")}`;
    addToken({
      name: newToken.name,
      category: (newToken.category || "color") as TokenCategory,
      value: newToken.value,
      cssVariable: cssVar,
      label: newToken.label || newToken.name,
    });

    setNewToken({ category: "color", name: "", value: "#3b82f6", cssVariable: "", label: "" });
    setIsAdding(false);
  }, [newToken, addToken]);

  const handleCopyCSS = useCallback((token: DesignToken) => {
    navigator.clipboard.writeText(`var(${token.cssVariable})`);
    setCopiedToken(token.name);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  const handleExportCSS = useCallback(() => {
    const css = `:root {\n${tokens.tokens
      .map((t) => `  ${t.cssVariable}: ${t.value};`)
      .join("\n")}\n}`;
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-tokens.css";
    a.click();
    URL.revokeObjectURL(url);
  }, [tokens]);

  // Inject tokens as CSS variables into the document
  React.useEffect(() => {
    const style = document.getElementById("genui-design-tokens") || document.createElement("style");
    style.id = "genui-design-tokens";
    style.textContent = `:root {\n${tokens.tokens
      .map((t) => `  ${t.cssVariable}: ${t.value};`)
      .join("\n")}\n}`;
    if (!document.getElementById("genui-design-tokens")) {
      document.head.appendChild(style);
    }
  }, [tokens]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5" />
            Design Tokens
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSS}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all"
              title="Export as CSS"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all"
              title="Add Token"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-gray-500">
          {tokens.tokens.length} tokens • {tokens.metadata.name} v{tokens.metadata.version}
        </div>
      </div>

      {/* Add Token Form */}
      {isAdding && (
        <div className="p-3 border-b border-white/5 bg-white/[0.02] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newToken.category}
              onChange={(e) => setNewToken((prev) => ({ ...prev, category: e.target.value as TokenCategory }))}
              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              value={newToken.name || ""}
              onChange={(e) => setNewToken((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. color.brand.500"
              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-2">
            {newToken.category === "color" ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={newToken.value || "#3b82f6"}
                  onChange={(e) => setNewToken((prev) => ({ ...prev, value: e.target.value }))}
                  className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  value={newToken.value || ""}
                  onChange={(e) => setNewToken((prev) => ({ ...prev, value: e.target.value }))}
                  className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono outline-none focus:border-blue-500/50"
                />
              </div>
            ) : (
              <input
                value={newToken.value || ""}
                onChange={(e) => setNewToken((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Value (e.g. 16px)"
                className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddToken}
              disabled={!newToken.name || !newToken.value}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium py-1.5 rounded transition-colors disabled:opacity-50"
            >
              Add Token
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] font-medium py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Token List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.entries(grouped).map(([category, categoryTokens]) => (
          <div key={category} className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>{CATEGORY_ICONS[category as TokenCategory] || "•"}</span>
              {CATEGORY_LABELS[category as TokenCategory] || category}
              <span className="text-gray-600 font-normal">({categoryTokens.length})</span>
            </div>

            {categoryTokens.map((token) => (
              <div
                key={token.name}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              >
                {/* Color swatch or value preview */}
                {token.category === "color" ? (
                  <div className="relative">
                    <div
                      className="w-7 h-7 rounded-md border border-white/10 shadow-inner cursor-pointer"
                      style={{ backgroundColor: token.value }}
                    />
                    <input
                      type="color"
                      value={token.value}
                      onChange={(e) => updateToken(token.name, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-gray-400 font-mono">
                    {token.value.replace(/px$/, "")}
                  </div>
                )}

                {/* Token info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-gray-300 truncate">
                    {token.label || token.name}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono truncate">
                    {token.cssVariable}
                  </div>
                </div>

                {/* Value editor */}
                {token.category !== "color" && (
                  <input
                    value={token.value}
                    onChange={(e) => updateToken(token.name, e.target.value)}
                    className="w-16 bg-black/20 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-gray-300 font-mono outline-none focus:border-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyCSS(token)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title={`Copy var(${token.cssVariable})`}
                  >
                    {copiedToken === token.name ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => removeToken(token.name)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Remove token"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
