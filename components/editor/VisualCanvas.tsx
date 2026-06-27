"use client";

import React, { useCallback, useMemo } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import CanvasErrorBoundary from "../canvas/CanvasErrorBoundary";
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
import PromptBar from "../llm/PromptBar";

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
        className="w-full h-full min-h-[400px] flex items-center justify-center p-8 bg-transparent"
        onClick={handleDeselect}
      >
        <div className="flex flex-col items-center gap-3 p-12 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <span className="text-2xl">🧩</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Your components will appear here
          </h3>
          <p className="text-xs text-gray-500">
            Edit the JSON in the editor or use the catalog to add components
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full min-h-[600px] bg-white dark:bg-[#0a0e1a] rounded-xl shadow-sm border border-gray-200 dark:border-white/10"
      onClick={handleDeselect}
    >
      <div className="p-6 pb-32">
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

      <PromptBar />
    </div>
  );
}
