"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { useLLMStore } from "@/lib/store/useLLMStore";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useToastStore } from "@/lib/store/useToastStore";
import {
  Settings,
  Share2,
  Download,
  Check,
  Loader2,
} from "lucide-react";

export default function Header() {
  const setExportModalOpen = useUIStore((s) => s.setExportModalOpen);
  const setShareModalOpen = useUIStore((s) => s.setShareModalOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const projectName = useUIStore((s) => s.projectName);
  const setProjectName = useUIStore((s) => s.setProjectName);
  const saveStatus = useUIStore((s) => s.saveStatus);

  const format = useSpecStore((s) => s.format);
  const setFormat = useSpecStore((s) => s.setFormat);

  const addToast = useToastStore((s) => s.addToast);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      setProjectName(trimmed);
    } else {
      setEditName(projectName);
    }
    setIsEditingName(false);
  };

  const handleFormatSwitch = (newFormat: "json-render" | "a2ui") => {
    if (newFormat === format) return;
    addToast({
      type: "warning",
      message: `Switching to ${newFormat === "a2ui" ? "A2UI" : "json-render"} will convert unsaved changes.`,
      duration: 8000,
      actions: [
        { label: "Cancel", onClick: () => {} },
        { label: "Switch anyway", onClick: () => setFormat(newFormat) },
      ],
    });
  };

  return (
    <header
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--surface-1)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        gap: 12,
      }}
    >
      {/* ─── Left: Logo + Name + Format ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
          }}
        >
          G
        </div>

        {/* Editable project name */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") {
                setEditName(projectName);
                setIsEditingName(false);
              }
            }}
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-accent)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              outline: "none",
              width: 160,
            }}
          />
        ) : (
          <button
            onClick={() => {
              setEditName(projectName);
              setIsEditingName(true);
            }}
            style={{
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            title="Click to rename project"
          >
            {projectName}
          </button>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        {/* Format switcher pill */}
        <div
          style={{
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: "var(--radius-md)",
            padding: 2,
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => handleFormatSwitch("json-render")}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: format === "json-render" ? "var(--bg-accent)" : "transparent",
              color: format === "json-render" ? "#fff" : "var(--text-secondary)",
            }}
          >
            json-render
          </button>
          <button
            onClick={() => handleFormatSwitch("a2ui")}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: format === "a2ui" ? "var(--bg-accent)" : "transparent",
              color: format === "a2ui" ? "#fff" : "var(--text-secondary)",
            }}
          >
            A2UI
          </button>
        </div>
      </div>

      {/* ─── Center-Right: Save status ──────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {saveStatus === "saved" ? (
          <>
            <Check style={{ width: 14, height: 14, color: "var(--text-success)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>All saved</span>
          </>
        ) : saveStatus === "saving" ? (
          <>
            <Loader2 style={{ width: 14, height: 14, color: "var(--text-muted)" }} className="animate-spin" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Saving…</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-warning)", fontWeight: 500 }}>Unsaved changes</span>
        )}
      </div>

      {/* ─── Right: Actions ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            padding: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "none";
          }}
          title="Settings"
        >
          <Settings style={{ width: 16, height: 16 }} />
        </button>

        <button
          onClick={() => setShareModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--surface-0)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <Share2 style={{ width: 12, height: 12 }} />
          Share
        </button>

        <button
          onClick={() => setExportModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--surface-0)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <Download style={{ width: 12, height: 12 }} />
          Export
        </button>
      </div>
    </header>
  );
}
