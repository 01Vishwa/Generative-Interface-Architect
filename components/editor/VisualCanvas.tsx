"use client";

import React, { useCallback, useMemo } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import CanvasErrorBoundary from "./canvas/CanvasErrorBoundary";
import NodeRenderer from "../canvas/NodeRenderer";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { findParentNode } from "@/lib/ir/mutations";

export default function VisualCanvas() {
  const irDocument = useSpecStore((s) => s.irDocument);
  const selectNode = useSpecStore((s) => s.selectNode);
  const moveComponent = useSpecStore((s) => s.moveComponent);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDeselect = useCallback(() => selectNode(null), [selectNode]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !irDocument) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const parent = findParentNode(irDocument.root, activeId);
      if (!parent) return;

      const oldIndex = parent.children.findIndex(c => c.id === activeId);
      const newIndex = parent.children.findIndex(c => c.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return;

      moveComponent(activeId, parent.id, newIndex);
    },
    [irDocument, moveComponent]
  );

  const sortableIds = useMemo(() => {
    if (!irDocument) return [];
    return irDocument.root.children.map(c => c.id);
  }, [irDocument]);

  if (!irDocument || irDocument.root.children.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
        onClick={handleDeselect}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: 48,
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              background: "var(--bg-info)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            🧩
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Your components will appear here
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Edit the JSON in the editor or use the catalog to add components
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: 400,
        background: "var(--surface-0)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
      }}
      onClick={handleDeselect}
    >
      <div style={{ padding: 24 }}>
        <CanvasErrorBoundary>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              {irDocument.root.children.map((child) => (
                <NodeRenderer key={child.id} node={child} depth={1} />
              ))}
            </SortableContext>
          </DndContext>
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
