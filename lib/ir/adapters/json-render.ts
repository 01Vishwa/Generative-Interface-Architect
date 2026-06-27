// ─── json-render ↔ IR Adapter ────────────────────────────────────────────────
// Parses a json-render spec into an IR tree and serializes back.

import type { IRNode, IRNodeMeta, IRValue, IRDocument } from "../types";
import { generateNodeId } from "../types";

// ─── Source Types ────────────────────────────────────────────────────────────

interface JsonRenderElement {
  type: string;
  props: Record<string, unknown>;
  children?: string[];
}

interface JsonRenderSpec {
  root: string;
  elements: Record<string, JsonRenderElement>;
}

// ─── Parse: json-render → IR ─────────────────────────────────────────────────

/**
 * Convert a json-render spec into an IR document.
 * The flat map of elements is converted into a recursive tree.
 */
export function parseJsonRender(spec: JsonRenderSpec): IRDocument {
  const visited = new Set<string>();

  function buildNode(elementId: string, path: string[]): IRNode {
    if (visited.has(elementId)) {
      // Circular reference guard
      return {
        id: generateNodeId(),
        type: "Text",
        props: { content: `[circular ref: ${elementId}]` },
        children: [],
        meta: {
          sourceFormat: "json-render",
          originalPath: path,
          sourceId: elementId,
          hasChildren: false,
        },
      };
    }
    visited.add(elementId);

    const element = spec.elements[elementId];
    if (!element) {
      return {
        id: generateNodeId(),
        type: "Text",
        props: { content: `[missing: ${elementId}]` },
        children: [],
        meta: {
          sourceFormat: "json-render",
          originalPath: path,
          sourceId: elementId,
          hasChildren: false,
        },
      };
    }

    const currentPath = [...path, elementId];
    const hasChildren = Array.isArray(element.children) && element.children.length > 0;

    // Normalize props — json-render props are already plain values
    const normalizedProps: Record<string, IRValue> = {};
    for (const [key, val] of Object.entries(element.props || {})) {
      normalizedProps[key] = normalizeJsonRenderValue(val);
    }

    // Recursively build child nodes
    const children: IRNode[] = [];
    if (element.children) {
      for (const childId of element.children) {
        children.push(buildNode(childId, currentPath));
      }
    }

    return {
      id: generateNodeId(),
      type: element.type,
      props: normalizedProps,
      children,
      meta: {
        sourceFormat: "json-render",
        originalPath: currentPath,
        sourceId: elementId,
        hasChildren: hasChildren || !!element.children,
      },
    };
  }

  const root = buildNode(spec.root, []);

  return {
    root,
    sourceFormat: "json-render",
    dataModel: {},
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    },
  };
}

// ─── Serialize: IR → json-render ─────────────────────────────────────────────

/**
 * Convert an IR document back to a json-render spec.
 * The recursive tree is flattened into an element map.
 */
export function serializeToJsonRender(doc: IRDocument): JsonRenderSpec {
  const elements: Record<string, JsonRenderElement> = {};

  function flattenNode(node: IRNode): string {
    // Use the original source ID if available, otherwise generate one
    const elementId = node.meta.sourceId || generateReadableIdFromType(node.type);

    const element: JsonRenderElement = {
      type: node.type,
      props: denormalizeProps(node.props),
    };

    if (node.children.length > 0 || node.meta.hasChildren) {
      const childIds: string[] = [];
      for (const child of node.children) {
        childIds.push(flattenNode(child));
      }
      element.children = childIds;
    }

    elements[elementId] = element;
    return elementId;
  }

  const rootId = flattenNode(doc.root);

  return {
    root: rootId,
    elements,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize a json-render value to an IRValue */
function normalizeJsonRenderValue(val: unknown): IRValue {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val;
  if (Array.isArray(val)) {
    return val.map((v) => normalizeJsonRenderValue(v)) as IRValue[];
  }
  // Object values — try to preserve as-is
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    // Check if it's a ref or expr
    if ("__ref" in obj && typeof obj.__ref === "string") {
      return { __ref: obj.__ref };
    }
    if ("__expr" in obj && typeof obj.__expr === "string") {
      return { __expr: obj.__expr };
    }
    // Otherwise serialize as string
    return JSON.stringify(val);
  }
  return String(val);
}

/** Convert IR props back to plain JSON values */
function denormalizeProps(props: Record<string, IRValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    result[key] = denormalizeValue(val);
  }
  return result;
}

function denormalizeValue(val: IRValue): unknown {
  if (val === null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val;
  if (Array.isArray(val)) {
    return val.map((v) => denormalizeValue(v as IRValue));
  }
  if (typeof val === "object") {
    if ("__ref" in val) return val;
    if ("__expr" in val) return val;
    if ("__binding" in val) return `{{${val.__binding.path}}}`;
  }
  return val;
}

let _readableIdCounter = 0;
function generateReadableIdFromType(type: string): string {
  _readableIdCounter++;
  return `${type.toLowerCase()}-${Date.now().toString(36).slice(-3)}-${_readableIdCounter}`;
}
