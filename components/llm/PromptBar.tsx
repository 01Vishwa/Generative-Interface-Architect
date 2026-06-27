"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLLMStream } from "@/hooks/useLLMStream";
import { useLLMStore } from "@/lib/store/useLLMStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { useToastStore } from "@/lib/store/useToastStore";
import {
  Sparkles,
  StopCircle,
  ChevronDown,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";

export default function PromptBarRedesigned() {
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { generate, abort, isGenerating } = useLLMStream();
  const streamProgress = useLLMStore((s) => s.streamProgress);

  const activePersonaId = useLLMStore((s) => s.activePersonaId);
  const personas = useLLMStore((s) => s.personas);
  const setActivePersona = useLLMStore((s) => s.setActivePersona);
  const getApiKey = useLLMStore((s) => s.getApiKey);
  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const addToast = useToastStore((s) => s.addToast);

  const inputRef = useRef<HTMLInputElement>(null);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);

  const hasApiKey = Boolean(
    getApiKey(activePersona.provider) || getApiKey("github") || activePersona.provider === "ollama"
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!prompt.trim() || isGenerating) return;

      if (!hasApiKey) {
        addToast({
          type: "error",
          message: "No API key configured — Configure in Settings",
          duration: null,
          actionLink: { label: "Open Settings", onClick: () => setSettingsOpen(true) },
        });
        return;
      }

      generate(prompt);
      setPrompt("");
    },
    [prompt, isGenerating, hasApiKey, generate, addToast, setSettingsOpen]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const barHeight = isFocused ? 120 : 64;
  const placeholderText = hasApiKey
    ? "Describe the UI you want to generate…"
    : "Add an API key in Settings to generate UI";

  return (
    <div
      style={{
        height: barHeight,
        minHeight: barHeight,
        borderTop: "1px solid var(--border)",
        background: "var(--surface-0)",
        display: "flex",
        flexDirection: "column",
        transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Progress bar during generation */}
      {isGenerating && (
        <div style={{ height: 2, background: "var(--surface-2)", width: "100%" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--bg-accent), #8b5cf6)",
              width: `${Math.max(5, streamProgress * 100)}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Main bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          flex: 1,
        }}
      >
        {/* Persona picker */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{activePersona.icon}</span>
            <span>{activePersona.name.split(" ").pop()}</span>
            <ChevronDown style={{ width: 12, height: 12, opacity: 0.5 }} />
          </button>

          {showPersonaDropdown && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 30 }}
                onClick={() => setShowPersonaDropdown(false)}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 4,
                  width: 240,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  padding: 4,
                  zIndex: 40,
                }}
                className="animate-fade-in"
              >
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePersona(p.id);
                      setShowPersonaDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 10px",
                      background: p.id === activePersonaId ? "var(--bg-accent)" : "transparent",
                      color: p.id === activePersonaId ? "#fff" : "var(--text-primary)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: 12,
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>{p.description.slice(0, 50)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={isGenerating}
          style={{
            flex: 1,
            height: 36,
            padding: "0 12px",
            fontSize: 13,
            color: "var(--text-primary)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />

        {/* Generate / Stop button */}
        {isGenerating ? (
          <button
            type="button"
            onClick={abort}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: "var(--bg-danger-strong)",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
          >
            <StopCircle style={{ width: 14, height: 14 }} />
            Stop
          </button>
        ) : (
          <div style={{ position: "relative" }}>
            <button
              type="submit"
              disabled={!prompt.trim() || !hasApiKey}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                background: !hasApiKey || !prompt.trim() ? "var(--text-muted)" : "var(--bg-accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: !hasApiKey || !prompt.trim() ? "not-allowed" : "pointer",
                opacity: !hasApiKey || !prompt.trim() ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              title={!hasApiKey ? "API key required — open Settings" : "Generate UI"}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Generate
            </button>
          </div>
        )}
      </form>

      {/* Expanded info row on focus */}
      {isFocused && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 8px",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
          className="animate-fade-in"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Zap style={{ width: 10, height: 10 }} />
              {activePersona.model}
            </span>
            <span>{activePersona.maxTokens.toLocaleString()} tokens</span>
          </div>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              transition: "color 0.15s",
            }}
            title="Prompt history"
          >
            <Clock style={{ width: 12, height: 12 }} />
            History
          </button>
        </div>
      )}
    </div>
  );
}
