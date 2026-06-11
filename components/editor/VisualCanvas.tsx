"use client";

import React, { useMemo, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { JsonRenderSpec } from "@/lib/types";
import { RENDERER_MAP } from "./canvas/ComponentRenderers";
import CanvasErrorBoundary from "./canvas/CanvasErrorBoundary";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { findParentId } from "@/lib/specMutations";

// ─── Sortable Wrapper ───────────────────────────────────────────────────────

function SortableItem({
  id,
  elementId,
  isSelected,
  typeName,
  onClick,
  children,
}: {
  id: string;
  elementId: string;
  isSelected: boolean;
  typeName: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-element-id={elementId}
      className={`relative group cursor-pointer rounded-lg transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-2"
          : "ring-1 ring-transparent hover:ring-gray-300"
      }`}
    >
      {/* Type badge */}
      <div
        className={`absolute -top-2.5 left-3 z-10 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm transition-opacity pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {typeName}
      </div>
      {children}
    </div>
  );
}

// ─── Main Canvas ────────────────────────────────────────────────────────────

export default function VisualCanvas() {
  const {
    parsedSpec,
    format,
    selectedElementId,
    selectElement,
    reorderElement,
  } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDeselect = useCallback(() => selectElement(null), [selectElement]);

  // ─── json-render recursive renderer ────────────────────────────────────

  const renderJsonRenderElement = useCallback(
    (elementId: string, spec: JsonRenderSpec, depth: number = 0): React.ReactNode => {
      const el = spec.elements[elementId];
      if (!el) return null;

      const Component = RENDERER_MAP[el.type];
      if (!Component) {
        return (
          <div key={elementId} className="p-3 bg-red-50 text-red-500 text-sm rounded border border-red-200">
            Unknown component: {el.type}
          </div>
        );
      }

      const isSelected = selectedElementId === elementId;
      const childElements = el.children
        ? el.children.map((childId) =>
            renderJsonRenderElement(childId, spec, depth + 1)
          )
        : null;

      const content = (
        <Component {...(el.props as Record<string, unknown>)}>
          {childElements}
        </Component>
      );

      // Only wrap top-level and direct children in sortable items
      if (depth <= 1) {
        return (
          <SortableItem
            key={elementId}
            id={elementId}
            elementId={elementId}
            isSelected={isSelected}
            typeName={el.type}
            onClick={() => selectElement(elementId)}
          >
            {content}
          </SortableItem>
        );
      }

      return (
        <div
          key={elementId}
          data-element-id={elementId}
          onClick={(e) => {
            e.stopPropagation();
            selectElement(elementId);
          }}
          className={`cursor-pointer rounded transition-all ${
            isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
          }`}
        >
          {content}
        </div>
      );
    },
    [selectedElementId, selectElement]
  );

  // ─── A2UI renderer ────────────────────────────────────────────────────

  const renderA2UI = useCallback(() => {
    if (!parsedSpec || !Array.isArray(parsedSpec)) return null;

    // Extract all components from updateComponents messages
    const components: { id: string; type: string; props: Record<string, unknown> }[] = [];
    let dataModel: Record<string, unknown> = {};

    for (const msg of parsedSpec) {
      if (msg.updateComponents?.components) {
        for (const c of msg.updateComponents.components) {
          const type = Object.keys(c.component)[0];
          const rawProps = c.component[type] || {};
          const props: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(rawProps) as [string, any][]) {
            if (val.literalString !== undefined) props[key] = val.literalString;
            else if (val.literalNumber !== undefined) props[key] = val.literalNumber;
            else if (val.literalBoolean !== undefined) props[key] = val.literalBoolean;
            else if (val.path !== undefined) {
              // Resolve from data model
              const pathKey = val.path.replace(/^\//, "");
              props[key] = dataModel[pathKey] ?? `{{${val.path}}}`;
            }
          }
          components.push({ id: c.id, type, props });
        }
      }
      if (msg.updateDataModel?.contents) {
        dataModel = { ...dataModel, ...msg.updateDataModel.contents };
      }
    }

    // Build a tree from children references
    const childrenMap = new Map<string, string[]>();
    for (const c of components) {
      if (typeof c.props.children === "string") {
        childrenMap.set(c.id, (c.props.children as string).split(/\s+/).filter(Boolean));
      }
    }

    const rendered = new Set<string>();

    function renderComponent(comp: typeof components[0]): React.ReactNode {
      if (rendered.has(comp.id)) return null;
      rendered.add(comp.id);

      const Component = RENDERER_MAP[comp.type];
      if (!Component) {
        return (
          <div key={comp.id} className="p-3 bg-red-50 text-red-500 text-sm rounded border border-red-200">
            Unknown: {comp.type}
          </div>
        );
      }

      const isSelected = selectedElementId === comp.id;
      const childIds = childrenMap.get(comp.id) || [];
      const childComponents = childIds
        .map((cid) => components.find((c) => c.id === cid))
        .filter(Boolean)
        .map((c) => renderComponent(c!));

      // Strip children prop from rendered props
      const { children: _children, ...renderProps } = comp.props;

      return (
        <SortableItem
          key={comp.id}
          id={comp.id}
          elementId={comp.id}
          isSelected={isSelected}
          typeName={comp.type}
          onClick={() => selectElement(comp.id)}
        >
          <Component {...renderProps}>
            {childComponents.length > 0 ? childComponents : null}
          </Component>
        </SortableItem>
      );
    }

    // Render root or all unparented components
    const allChildIds = new Set<string>();
    for (const ids of childrenMap.values()) {
      ids.forEach((id) => allChildIds.add(id));
    }
    const rootComponents = components.filter((c) => !allChildIds.has(c.id));

    return rootComponents.map((c) => renderComponent(c));
  }, [parsedSpec, selectedElementId, selectElement]);

  // ─── Sortable items for DnD context ───────────────────────────────────

  const sortableIds = useMemo(() => {
    if (!parsedSpec) return [];

    if (format === "json-render") {
      const spec = parsedSpec as JsonRenderSpec;
      const root = spec.elements[spec.root];
      return root?.children || [];
    }

    // A2UI: all component IDs
    const ids: string[] = [];
    if (Array.isArray(parsedSpec)) {
      for (const msg of parsedSpec) {
        if (msg.updateComponents?.components) {
          for (const c of msg.updateComponents.components) {
            ids.push(c.id);
          }
        }
      }
    }
    return ids;
  }, [parsedSpec, format]);

  // ─── DnD handler ──────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !parsedSpec) return;

      if (format === "json-render") {
        const spec = parsedSpec as JsonRenderSpec;
        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the parent that contains the active element
        const parentId = findParentId(spec, activeId);
        if (!parentId) return;

        const parent = spec.elements[parentId];
        if (!parent?.children) return;

        const oldIndex = parent.children.indexOf(activeId);
        const newIndex = parent.children.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return;

        reorderElement(parentId, oldIndex, newIndex);
      }
    },
    [parsedSpec, format, reorderElement]
  );

  // ─── Empty State ──────────────────────────────────────────────────────

  if (!parsedSpec) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-gray-50/50 p-8"
        onClick={handleDeselect}
      >
        <div className="flex flex-col items-center gap-3 p-12 border-2 border-dashed border-gray-300 rounded-xl text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">🧩</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-600">
            Your components will appear here
          </h3>
          <p className="text-xs text-gray-400">
            Edit the JSON in the editor or use the catalog to add components
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 bg-gray-50/50 p-6 overflow-y-auto"
      onClick={handleDeselect}
    >
      <div className="max-w-4xl mx-auto min-h-[400px]">
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
              {format === "json-render"
                ? renderJsonRenderElement(
                    (parsedSpec as JsonRenderSpec).root,
                    parsedSpec as JsonRenderSpec
                  )
                : renderA2UI()}
            </SortableContext>
          </DndContext>
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
