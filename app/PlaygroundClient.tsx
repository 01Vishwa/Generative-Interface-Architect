"use client";

import React, { useEffect } from "react";
import SpecEditor from "@/components/editor/SpecEditor";
import VisualCanvas from "@/components/editor/VisualCanvas";
import PropsInspector from "@/components/editor/PropsInspector";
import ComponentRegistry from "@/components/editor/ComponentRegistry";
import PromptBar from "@/components/llm/PromptBar";
import HistorySidebar from "@/components/editor/HistorySidebar";
import ImportCatalogModal from "@/components/editor/modals/ImportCatalogModal";
import KeyboardShortcutsModal from "@/components/editor/modals/KeyboardShortcutsModal";
import ExportModal from "@/components/editor/modals/ExportModal";
import ShareModal from "@/components/editor/modals/ShareModal";
import SettingsPanel from "@/components/editor/modals/SettingsPanel";
import ToastContainer from "@/components/ui/ToastContainer";
import Header from "@/components/chrome/Header";
import { useUIStore, type CenterViewMode } from "@/lib/store/useUIStore";
import { useSpecStore } from "@/lib/store/useSpecStore";
import {
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Columns2,
  Eye,
} from "lucide-react";

export default function PlaygroundClient() {
  const leftCollapsed = useUIStore((s) => s.leftCollapsed);
  const rightCollapsed = useUIStore((s) => s.rightCollapsed);
  const leftSidebarWidth = useUIStore((s) => s.leftSidebarWidth);
  const rightSidebarWidth = useUIStore((s) => s.rightSidebarWidth);
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const centerViewMode = useUIStore((s) => s.centerViewMode);
  const setCenterViewMode = useUIStore((s) => s.setCenterViewMode);

  // ─── Keyboard shortcuts ⌘1/⌘2/⌘3 ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (!isCmd) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest(".monaco-editor")
      )
        return;

      if (e.key === "1") { e.preventDefault(); setCenterViewMode("code"); }
      else if (e.key === "2") { e.preventDefault(); setCenterViewMode("split"); }
      else if (e.key === "3") { e.preventDefault(); setCenterViewMode("preview"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCenterViewMode]);

  const modeTabs = [
    { id: "code", label: "Code", icon: <Code2 style={{ width: 12, height: 12 }} /> },
    { id: "split", label: "Split", icon: <Columns2 style={{ width: 12, height: 12 }} /> },
    { id: "preview", label: "Preview", icon: <Eye style={{ width: 12, height: 12 }} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--surface-0)", color: "var(--text-primary)" }}>
      {/* Header */}
      <Header />

      {/* 3-Pane Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Left: Component Registry */}
        <div
          className="pane-collapsible"
          style={{
            width: leftCollapsed ? 0 : leftSidebarWidth,
            minWidth: leftCollapsed ? 0 : 200,
            borderRight: leftCollapsed ? "none" : "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {!leftCollapsed && <ComponentRegistry />}
        </div>

        {/* Left toggle */}
        <button
          onClick={toggleLeftSidebar}
          title={leftCollapsed ? "Show sidebar" : "Hide sidebar"}
          style={{
            position: "absolute",
            left: leftCollapsed ? 0 : leftSidebarWidth - 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            width: 20,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          {leftCollapsed ? <ChevronsRight style={{ width: 12, height: 12 }} /> : <ChevronsLeft style={{ width: 12, height: 12 }} />}
        </button>

        {/* Center */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 300 }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", height: 32, paddingLeft: 8 }}>
            {modeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCenterViewMode(tab.id as CenterViewMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0 12px",
                  height: "100%",
                  fontSize: 11,
                  fontWeight: centerViewMode === tab.id ? 700 : 500,
                  color: centerViewMode === tab.id ? "var(--text-accent)" : "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  borderBottom: centerViewMode === tab.id ? "2px solid var(--bg-accent)" : "2px solid transparent",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {(centerViewMode === "code" || centerViewMode === "split") && (
              <div style={{ width: centerViewMode === "split" ? "50%" : "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <SpecEditor />
              </div>
            )}
            {centerViewMode === "split" && (
              <div style={{ width: 4, background: "var(--border)", flexShrink: 0, cursor: "col-resize" }} />
            )}
            {(centerViewMode === "preview" || centerViewMode === "split") && (
              <div style={{ width: centerViewMode === "split" ? "50%" : "100%", overflow: "auto", padding: 16 }}>
                <VisualCanvas />
              </div>
            )}
          </div>

          {/* Prompt Bar */}
          <PromptBar />
        </div>

        {/* Right: Props Inspector */}
        <div
          className="pane-collapsible"
          style={{
            width: rightCollapsed ? 0 : rightSidebarWidth,
            minWidth: rightCollapsed ? 0 : 220,
            borderLeft: rightCollapsed ? "none" : "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {!rightCollapsed && <PropsInspector />}
        </div>

        {/* Right toggle */}
        <button
          onClick={toggleRightSidebar}
          title={rightCollapsed ? "Show inspector" : "Hide inspector"}
          style={{
            position: "absolute",
            right: rightCollapsed ? 0 : rightSidebarWidth - 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            width: 20,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          {rightCollapsed ? <ChevronsLeft style={{ width: 12, height: 12 }} /> : <ChevronsRight style={{ width: 12, height: 12 }} />}
        </button>
      </div>

      {/* Global Overlays */}
      <ToastContainer />
      <SettingsPanel />
      <HistorySidebar />
      <ImportCatalogModal />
      <KeyboardShortcutsModal />
      <ExportModal />
      <ShareModal />
    </div>
  );
}
