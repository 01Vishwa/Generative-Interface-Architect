/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { use, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUIStore } from "@/lib/store/useUIStore";
import { useResizable } from "@/hooks/useResizable";
import PaneResizer from "@/components/chrome/PaneResizer";
import TabBar from "@/components/chrome/TabBar";
import SpecEditor from "@/components/editor/SpecEditor";
import VisualCanvas from "@/components/editor/VisualCanvas";
import PropsInspector from "@/components/editor/PropsInspector";
import Timeline from "@/components/timeline/Timeline";
import BranchManager from "@/components/timeline/BranchManager";
import EventLog from "@/components/timeline/EventLog";
import ComponentRegistry from "@/components/editor/ComponentRegistry";
import LivePreview from "@/components/editor/LivePreview";
import DesignTokenEditor from "@/components/editor/DesignTokenEditor";
import DiffView from "@/components/timeline/DiffView";

export default function WorkspacePage(props: { params: Promise<{ workspaceId: string }> }) {
  const params = use(props.params);
  const { workspaceId } = params;
  
  const { load, isDirty } = useWorkspace({ workspaceId, autoSaveInterval: 2000 });
  
  const panelSizes = useUIStore((s) => s.panelSizes);
  const setPanelSizes = useUIStore((s) => s.setPanelSizes);
  const editorTab = useUIStore((s) => s.editorTab);
  const setEditorTab = useUIStore((s) => s.setEditorTab);
  const inspectorTab = useUIStore((s) => s.inspectorTab);
  const setInspectorTab = useUIStore((s) => s.setInspectorTab);
  const timelineOpen = useUIStore((s) => s.timelineOpen);

  const [canvasTab, setCanvasTab] = useState<"canvas" | "preview">("canvas");
  const [bottomTab, setBottomTab] = useState<"timeline" | "diff">("timeline");

  const { sizes, onDragStart, onDividerKeyDown, containerRef } = useResizable({
    paneCount: 3,
    initialSizes: panelSizes,
    minSize: 15,
    maxSize: 70,
    direction: "horizontal",
    onResize: (newSizes) => setPanelSizes(newSizes as [number, number, number]),
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0e1a]">
      {/* 3-Pane Layout */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        
        {/* Pane 1: Editor / Code */}
        <div style={{ width: `${sizes[0]}%` }} className="flex flex-col shrink-0 border-r border-white/5 bg-[#0d1117]">
          <TabBar 
            tabs={[
              { id: "editor", label: "Spec Editor" },
              { id: "console", label: "Console", badge: 0 }
            ]} 
            activeTab={editorTab}
            onTabChange={(tab) => setEditorTab(tab as any)}
            className="!bg-[#0a0e1a] !border-white/5"
          />
          <div className="flex-1 overflow-hidden relative">
            {editorTab === "editor" ? (
              <SpecEditor />
            ) : (
              <div className="p-4 text-sm text-gray-500 font-mono">Console output...</div>
            )}
            
            {/* Unsaved indicator */}
            {isDirty && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 px-2 py-1 bg-white/10 backdrop-blur rounded text-[10px] text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </div>
            )}
          </div>
        </div>

        <PaneResizer 
          onMouseDown={onDragStart(0)} 
          onKeyDown={onDividerKeyDown(0)} 
        />

        {/* Pane 2: Visual Canvas / Preview */}
        <div style={{ width: `${sizes[1]}%` }} className="flex flex-col shrink-0 bg-gray-50 dark:bg-gray-950/50">
          <TabBar 
            tabs={[
              { id: "canvas", label: "Visual Canvas" },
              { id: "preview", label: "Live Preview" }
            ]} 
            activeTab={canvasTab}
            onTabChange={(tab) => setCanvasTab(tab as "canvas" | "preview")}
            className="!bg-[#0a0e1a] !border-white/5"
          />
          <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center relative">
            {canvasTab === "canvas" ? <VisualCanvas /> : <LivePreview />}
          </div>
        </div>

        <PaneResizer 
          onMouseDown={onDragStart(1)} 
          onKeyDown={onDividerKeyDown(1)} 
        />

        {/* Pane 3: Inspector / Registry */}
        <div style={{ width: `${sizes[2]}%` }} className="flex flex-col shrink-0 border-l border-white/5 bg-[#0d1117]">
          <TabBar 
            tabs={[
              { id: "properties", label: "Properties" },
              { id: "registry", label: "Registry" },
              { id: "tokens", label: "Tokens" }
            ]} 
            activeTab={inspectorTab}
            onTabChange={(tab) => setInspectorTab(tab as any)}
            className="!bg-[#0a0e1a] !border-white/5"
          />
          <div className="flex-1 overflow-auto">
            {inspectorTab === "properties" && <PropsInspector />}
            {inspectorTab === "registry" && <ComponentRegistry />}
            {inspectorTab === "tokens" && <DesignTokenEditor />}
          </div>
        </div>
      </div>

      {/* Timeline Bottom Bar */}
      {timelineOpen && (
        <div className="h-72 flex flex-col border-t border-white/10 bg-[#0d1117] shrink-0">
          <TabBar 
            tabs={[
              { id: "timeline", label: "Timeline" },
              { id: "diff", label: "Diff View" }
            ]}
            activeTab={bottomTab}
            onTabChange={(tab) => setBottomTab(tab as "timeline" | "diff")}
            className="!bg-[#0a0e1a] !border-white/5"
          />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {bottomTab === "timeline" ? <Timeline /> : <DiffView />}
            </div>
            <div className="w-64 border-l border-white/5">
              <EventLog />
            </div>
            <div className="w-64 border-l border-white/5">
              <BranchManager />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
