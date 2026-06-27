/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { use, useState, useCallback, useRef, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUIStore, type CenterViewMode } from "@/lib/store/useUIStore";
import { useResizable } from "@/hooks/useResizable";
import PaneResizer from "@/components/chrome/PaneResizer";
import SpecEditor from "@/components/editor/SpecEditor";
import VisualCanvas from "@/components/editor/VisualCanvas";
import PropsInspector from "@/components/editor/PropsInspector";
import ComponentRegistry from "@/components/editor/ComponentRegistry";
import PromptBar from "@/components/llm/PromptBar";
import ToastContainer from "@/components/ui/ToastContainer";
import SettingsPanel from "@/components/editor/modals/SettingsPanel";
import Timeline from "@/components/timeline/Timeline";
import EventLog from "@/components/timeline/EventLog";
import DiffView from "@/components/timeline/DiffView";
import TabBar from "@/components/chrome/TabBar";
import {
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Columns2,
  Eye,
} from "lucide-react";

export default function WorkspacePage(props: { params: Promise<{ workspaceId: string }> }) {
  const params = use(props.params);
  const { workspaceId } = params;

  const { load, isDirty } = useWorkspace({ workspaceId, autoSaveInterval: 2000 });

  // ─── UI Store ─────────────────────────────────────────────────────
  const leftSidebarWidth = useUIStore((s) => s.leftSidebarWidth);
  const rightSidebarWidth = useUIStore((s) => s.rightSidebarWidth);
  const leftCollapsed = useUIStore((s) => s.leftCollapsed);
  const rightCollapsed = useUIStore((s) => s.rightCollapsed);
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const setLeftSidebarWidth = useUIStore((s) => s.setLeftSidebarWidth);
  const setRightSidebarWidth = useUIStore((s) => s.setRightSidebarWidth);
  const centerViewMode = useUIStore((s) => s.centerViewMode);
  const setCenterViewMode = useUIStore((s) => s.setCenterViewMode);
  const timelineOpen = useUIStore((s) => s.timelineOpen);
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);

  const [bottomTab, setBottomTab] = useState<"timeline" | "diff">("timeline");

  // Track save status
  useEffect(() => {
    setSaveStatus(isDirty ? "unsaved" : "saved");
  }, [isDirty, setSaveStatus]);

  // ─── Center split ratio (for draggable divider in split mode) ─────
  const [splitRatio, setSplitRatio] = useState(50);
  const splitDividerRef = useRef<HTMLDivElement>(null);
  const centerPaneRef = useRef<HTMLDivElement>(null);

  const handleSplitDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = centerPaneRef.current;
      if (!container) return;

      const startX = e.clientX;
      const containerRect = container.getBoundingClientRect();

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - containerRect.left;
        const pct = Math.min(85, Math.max(15, (delta / containerRect.width) * 100));
        setSplitRatio(pct);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    []
  );

  const handleSplitDoubleClick = useCallback(() => {
    setSplitRatio(50);
  }, []);

  // ─── Keyboard shortcuts for center mode ───────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (!isCmd) return;

      // Don't intercept when in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest(".monaco-editor")
      )
        return;

      if (e.key === "1") {
        e.preventDefault();
        setCenterViewMode("code");
      } else if (e.key === "2") {
        e.preventDefault();
        setCenterViewMode("split");
      } else if (e.key === "3") {
        e.preventDefault();
        setCenterViewMode("preview");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCenterViewMode]);

  // ─── Mode tab definitions ─────────────────────────────────────────
  const modeTabs = [
    { id: "code", label: "Code", icon: <Code2 style={{ width: 12, height: 12 }} /> },
    { id: "split", label: "Split", icon: <Columns2 style={{ width: 12, height: 12 }} /> },
    { id: "preview", label: "Preview", icon: <Eye style={{ width: 12, height: 12 }} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--surface-0)",
      }}
    >
      {/* ─── 3-Pane Layout ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* ─── Left Sidebar: Component Registry ──────────────────── */}
        <div
          className="pane-collapsible"
          style={{
            width: leftCollapsed ? 0 : leftSidebarWidth,
            minWidth: leftCollapsed ? 0 : 200,
            borderRight: leftCollapsed ? "none" : "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {!leftCollapsed && <ComponentRegistry />}
        </div>

        {/* Left collapse toggle */}
        <button
          onClick={toggleLeftSidebar}
          title={`${leftCollapsed ? "Show" : "Hide"} Component Registry (⌘[)`}
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
            fontSize: 10,
            transition: "all 0.2s",
          }}
        >
          {leftCollapsed ? <ChevronsRight style={{ width: 12, height: 12 }} /> : <ChevronsLeft style={{ width: 12, height: 12 }} />}
        </button>

        {/* ─── Center Pane ───────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 300,
          }}
        >
          {/* Mode tab bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-1)",
              height: 32,
              paddingLeft: 8,
            }}
          >
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
                  transition: "all 0.15s",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Center content area */}
          <div ref={centerPaneRef} style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
            {/* Code editor */}
            {(centerViewMode === "code" || centerViewMode === "split") && (
              <div
                style={{
                  width: centerViewMode === "split" ? `${splitRatio}%` : "100%",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <SpecEditor />
              </div>
            )}

            {/* Split divider */}
            {centerViewMode === "split" && (
              <div
                ref={splitDividerRef}
                onMouseDown={handleSplitDragStart}
                onDoubleClick={handleSplitDoubleClick}
                style={{
                  width: 4,
                  cursor: "col-resize",
                  background: "var(--border)",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 10,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--border)")}
              >
                {/* Wider hit area */}
                <div style={{ position: "absolute", inset: "-2px -4px", cursor: "col-resize" }} />
              </div>
            )}

            {/* Preview / Canvas */}
            {(centerViewMode === "preview" || centerViewMode === "split") && (
              <div
                style={{
                  width: centerViewMode === "split" ? `${100 - splitRatio}%` : "100%",
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  <VisualCanvas />
                </div>
              </div>
            )}

          </div>

          {/* Prompt Bar at bottom */}
          <PromptBar />
        </div>

        {/* ─── Right Sidebar: Props Inspector ────────────────────── */}
        <div
          className="pane-collapsible"
          style={{
            width: rightCollapsed ? 0 : rightSidebarWidth,
            minWidth: rightCollapsed ? 0 : 220,
            borderLeft: rightCollapsed ? "none" : "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {!rightCollapsed && <PropsInspector />}
        </div>

        {/* Right collapse toggle */}
        <button
          onClick={toggleRightSidebar}
          title={`${rightCollapsed ? "Show" : "Hide"} Props Inspector (⌘])`}
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
            fontSize: 10,
            transition: "all 0.2s",
          }}
        >
          {rightCollapsed ? <ChevronsLeft style={{ width: 12, height: 12 }} /> : <ChevronsRight style={{ width: 12, height: 12 }} />}
        </button>
      </div>

      {/* ─── Timeline Bottom Panel ──────────────────────────────── */}
      {timelineOpen && (
        <div
          style={{
            height: 280,
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-1)",
            flexShrink: 0,
          }}
        >
          <TabBar
            tabs={[
              { id: "timeline", label: "Timeline" },
              { id: "diff", label: "Diff View" },
            ]}
            activeTab={bottomTab}
            onTabChange={(tab) => setBottomTab(tab as "timeline" | "diff")}
          />
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {bottomTab === "timeline" ? <Timeline /> : <DiffView />}
            </div>
            <div style={{ width: 240, borderLeft: "1px solid var(--border)" }}>
              <EventLog />
            </div>
          </div>
        </div>
      )}

      {/* ─── Global Overlays ────────────────────────────────────── */}
      <ToastContainer />
      <SettingsPanel />
    </div>
  );
}
