/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import type { IRNode } from "@/lib/ir/types";
import { RENDERER_MAP } from "../editor/canvas/ComponentRenderers";
import SelectionOverlay from "./SelectionOverlay";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NodeRendererProps {
  node: IRNode;
  depth?: number;
}

export default function NodeRenderer({ node, depth = 0 }: NodeRendererProps) {
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);

  const Component = RENDERER_MAP[node.type];
  const isSelected = selectedNodeId === node.id;

  // DnD Sortable hook
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(node.id);
    },
    [node.id, selectNode]
  );

  if (!Component) {
    return (
      <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">
        Unknown component: {node.type}
      </div>
    );
  }

  // Denormalize props for React
  const renderProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(node.props)) {
    if (typeof val === "object" && val !== null) {
      if ("__binding" in val) {
        // We'll pass the resolved value or fallback to the binding syntax
        renderProps[key] = (val as any).__binding.resolvedValue ?? `{{${(val as any).__binding.path}}}`;
      } else if ("__ref" in val) {
        renderProps[key] = (val as any).__ref;
      } else if ("__expr" in val) {
        renderProps[key] = (val as any).__expr;
      } else {
        renderProps[key] = val;
      }
    } else {
      renderProps[key] = val;
    }
  }

  const childElements = node.children.map((child) => (
    <NodeRenderer key={child.id} node={child} depth={depth + 1} />
  ));

  const content = (
    <Component {...renderProps}>
      {node.children.length > 0 && (
        <SortableContext
          items={node.children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {childElements}
        </SortableContext>
      )}
    </Component>
  );

  // Top level elements are sortable
  if (depth <= 1) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="relative group rounded-lg"
      >
        <SelectionOverlay isSelected={isSelected} typeName={node.type} nodeId={node.id} />
        {content}
      </div>
    );
  }

  // Deeply nested elements
  return (
    <div onClick={handleClick} className="relative group rounded">
      <SelectionOverlay isSelected={isSelected} typeName={node.type} nodeId={node.id} />
      {content}
    </div>
  );
}
