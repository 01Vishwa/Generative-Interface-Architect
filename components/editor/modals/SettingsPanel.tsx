"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { useLLMStore, DEFAULT_PERSONAS } from "@/lib/store/useLLMStore";
import { useToastStore } from "@/lib/store/useToastStore";
import {
  X,
  Key,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Keyboard,
} from "lucide-react";

const PROVIDERS = [
  { id: "github", label: "GitHub Models" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "ollama", label: "Ollama (local)" },
];

const SHORTCUTS = [
  { keys: "Ctrl+S", action: "Save snapshot" },
  { keys: "Ctrl+/", action: "Toggle history" },
  { keys: "Ctrl+1", action: "Code only mode" },
  { keys: "Ctrl+2", action: "Split mode" },
  { keys: "Ctrl+3", action: "Preview only mode" },
  { keys: "?", action: "Keyboard shortcuts" },
  { keys: "Esc", action: "Deselect / Close" },
  { keys: "Delete", action: "Remove selected" },
];

export default function SettingsPanel() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const apiKeys = useLLMStore((s) => s.apiKeys);
  const setApiKey = useLLMStore((s) => s.setApiKey);
  const activePersonaId = useLLMStore((s) => s.activePersonaId);
  const personas = useLLMStore((s) => s.personas);
  const setActivePersona = useLLMStore((s) => s.setActivePersona);

  const addToast = useToastStore((s) => s.addToast);

  // Local state for editing
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | null>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setLocalKeys({ ...apiKeys });
      setHasChanges(false);
      setTestResults({});
    }
  }, [settingsOpen, apiKeys]);

  const handleKeyChange = (provider: string, value: string) => {
    setLocalKeys((prev) => ({ ...prev, [provider]: value }));
    setHasChanges(true);
  };

  const handleSave = useCallback(() => {
    Object.entries(localKeys).forEach(([provider, key]) => {
      setApiKey(provider, key);
    });
    setHasChanges(false);
    addToast({ type: "success", message: "Settings saved", duration: 3000 });
  }, [localKeys, setApiKey, addToast]);

  const handleClose = () => {
    if (hasChanges) {
      addToast({
        type: "warning",
        message: "Unsaved changes · Save now",
        duration: null,
        actions: [
          { label: "Discard", onClick: () => setSettingsOpen(false) },
          {
            label: "Save now",
            onClick: () => {
              handleSave();
              setSettingsOpen(false);
            },
          },
        ],
      });
    } else {
      setSettingsOpen(false);
    }
  };

  const handleTestConnection = async (provider: string) => {
    const key = localKeys[provider];
    if (!key && provider !== "ollama") {
      setTestResults((prev) => ({ ...prev, [provider]: "error" }));
      return;
    }
    // Simulated test — in real app, this would call the API
    setTestResults((prev) => ({ ...prev, [provider]: null }));
    setTimeout(() => {
      setTestResults((prev) => ({
        ...prev,
        [provider]: key || provider === "ollama" ? "success" : "error",
      }));
    }, 800);
  };

  if (!settingsOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="slide-over-overlay" onClick={handleClose} />

      {/* Panel */}
      <div className="slide-over-panel" style={{ display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Settings
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-muted)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* ─── AI Providers ──────────────────────────── */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              AI Providers
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    padding: 12,
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {provider.label}
                    </span>
                    {testResults[provider.id] === "success" && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-success)" }}>
                        <CheckCircle2 style={{ width: 12, height: 12 }} /> Connected
                      </span>
                    )}
                    {testResults[provider.id] === "error" && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-danger)" }}>
                        <XCircle style={{ width: 12, height: 12 }} /> Failed
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Key style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)" }} />
                      <input
                        type="password"
                        value={localKeys[provider.id] || ""}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        placeholder={provider.id === "ollama" ? "http://localhost:11434" : "sk-…"}
                        style={{
                          width: "100%",
                          padding: "6px 8px 6px 28px",
                          fontSize: 12,
                          background: "var(--surface-0)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleTestConnection(provider.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Model ──────────────────────────────────── */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Model
            </h3>
            <select
              value={activePersonaId}
              onChange={(e) => setActivePersona(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 13,
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} — {p.model} ({p.maxTokens.toLocaleString()} ctx)
                </option>
              ))}
            </select>
          </section>

          {/* ─── Theme ──────────────────────────────────── */}
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Theme
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setTheme("light")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: theme === "light" ? "var(--bg-accent)" : "var(--surface-1)",
                  color: theme === "light" ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${theme === "light" ? "var(--bg-accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Sun style={{ width: 14, height: 14 }} /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: theme === "dark" ? "var(--bg-accent)" : "var(--surface-1)",
                  color: theme === "dark" ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${theme === "dark" ? "var(--bg-accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Moon style={{ width: 14, height: 14 }} /> Dark
              </button>
            </div>
          </section>

          {/* ─── Shortcuts ──────────────────────────────── */}
          <section>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Keyboard style={{ width: 14, height: 14 }} /> Keyboard Shortcuts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SHORTCUTS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: i % 2 === 0 ? "var(--surface-1)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.action}</span>
                  <kbd
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      padding: "2px 6px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 3,
                      color: "var(--text-muted)",
                    }}
                  >
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: hasChanges ? "var(--bg-accent)" : "var(--surface-2)",
              color: hasChanges ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: hasChanges ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
