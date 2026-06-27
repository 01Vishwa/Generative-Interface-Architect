// ─── A2UI ↔ IR Adapter ───────────────────────────────────────────────────────
// Parses an A2UI message sequence into an IR tree and serializes back.

import type { IRNode, IRValue, IRDocument, DataBinding } from "../types";
import { generateNodeId } from "../types";

// ─── Source Types ────────────────────────────────────────────────────────────

interface BoundValue {
  literalString?: string;
  literalNumber?: number;
  literalBoolean?: boolean;
  path?: string;
}

interface A2UIComponent {
  id: string;
  component: Record<string, Record<string, BoundValue>>;
}

interface A2UIMessage {
  createSurface?: { surfaceId: string; catalogId: string };
  updateComponents?: { surfaceId: string; components: A2UIComponent[] };
  updateDataModel?: { surfaceId: string; contents: Record<string, unknown> };
}

// ─── Parse: A2UI → IR ────────────────────────────────────────────────────────

/**
 * Convert an A2UI message sequence into an IR document.
 * Extracts components, resolves data bindings, and builds a tree.
 */
export function parseA2UI(messages: A2UIMessage[]): IRDocument {
  // Extract surface info
  let surface: { surfaceId: string; catalogId: string } | undefined;
  const dataModel: Record<string, unknown> = {};
  const components: { id: string; type: string; rawProps: Record<string, BoundValue>; messageIndex: number }[] = [];

  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];

    if (msg.createSurface) {
      surface = msg.createSurface;
    }

    if (msg.updateComponents?.components) {
      for (const comp of msg.updateComponents.components) {
        const compType = Object.keys(comp.component)[0];
        if (!compType) continue;
        components.push({
          id: comp.id,
          type: compType,
          rawProps: comp.component[compType] || {},
          messageIndex: mi,
        });
      }
    }

    if (msg.updateDataModel?.contents) {
      Object.assign(dataModel, msg.updateDataModel.contents);
    }
  }

  // Build a map of component ID → parsed data
  const componentMap = new Map(components.map((c) => [c.id, c]));

  // Identify parent-child relationships
  const childrenMap = new Map<string, string[]>();
  for (const comp of components) {
    const childrenProp = comp.rawProps.children;
    if (childrenProp?.literalString) {
      const childIds = childrenProp.literalString.split(/\s+/).filter(Boolean);
      childrenMap.set(comp.id, childIds);
    }
  }

  // Find root components (not referenced as children by anyone)
  const allChildIds = new Set<string>();
  for (const ids of childrenMap.values()) {
    ids.forEach((id) => allChildIds.add(id));
  }
  const rootComponents = components.filter((c) => !allChildIds.has(c.id));

  // Build IR tree recursively
  const visited = new Set<string>();

  function buildNode(compId: string, path: string[]): IRNode | null {
    if (visited.has(compId)) return null;
    visited.add(compId);

    const comp = componentMap.get(compId);
    if (!comp) return null;

    const currentPath = [...path, compId];
    const dataBindings: DataBinding[] = [];

    // Normalize props — resolve BoundValues to plain values
    const normalizedProps: Record<string, IRValue> = {};
    for (const [key, boundVal] of Object.entries(comp.rawProps)) {
      if (key === "children") continue; // Children handled via tree structure

      if (boundVal.literalString !== undefined) {
        normalizedProps[key] = boundVal.literalString;
      } else if (boundVal.literalNumber !== undefined) {
        normalizedProps[key] = boundVal.literalNumber;
      } else if (boundVal.literalBoolean !== undefined) {
        normalizedProps[key] = boundVal.literalBoolean;
      } else if (boundVal.path !== undefined) {
        // Resolve from data model
        const pathKey = boundVal.path.replace(/^\//, "");
        const resolved = dataModel[pathKey];
        dataBindings.push({ path: boundVal.path, resolvedValue: resolved });
        normalizedProps[key] = {
          __binding: { path: boundVal.path, resolvedValue: resolved },
        };
      }
    }

    // Build children
    const childIds = childrenMap.get(compId) || [];
    const children: IRNode[] = [];
    for (const childId of childIds) {
      const childNode = buildNode(childId, currentPath);
      if (childNode) children.push(childNode);
    }

    return {
      id: generateNodeId(),
      type: comp.type,
      props: normalizedProps,
      children,
      meta: {
        sourceFormat: "a2ui",
        originalPath: currentPath,
        sourceId: comp.id,
        hasChildren: childIds.length > 0 || childrenMap.has(compId),
        dataBindings: dataBindings.length > 0 ? dataBindings : undefined,
      },
    };
  }

  // Build root — if there's a single root, use it; otherwise wrap in a Stack
  let root: IRNode;

  if (rootComponents.length === 1) {
    const built = buildNode(rootComponents[0].id, []);
    root = built || createEmptyRoot("a2ui");
  } else if (rootComponents.length > 1) {
    const children: IRNode[] = [];
    for (const rc of rootComponents) {
      const built = buildNode(rc.id, []);
      if (built) children.push(built);
    }
    root = {
      id: generateNodeId(),
      type: "Stack",
      props: { direction: "column", gap: "md" },
      children,
      meta: {
        sourceFormat: "a2ui",
        originalPath: [],
        sourceId: "root",
        hasChildren: true,
      },
    };
  } else {
    root = createEmptyRoot("a2ui");
  }

  return {
    root,
    sourceFormat: "a2ui",
    dataModel,
    surface,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    },
  };
}

// ─── Serialize: IR → A2UI ────────────────────────────────────────────────────

/**
 * Convert an IR document back to an A2UI message sequence.
 */
export function serializeToA2UI(doc: IRDocument): A2UIMessage[] {
  const messages: A2UIMessage[] = [];

  // 1. createSurface
  messages.push({
    createSurface: doc.surface || { surfaceId: "main", catalogId: "basic" },
  });

  // 2. Flatten IR tree to components
  const components: A2UIComponent[] = [];

  function flattenNode(node: IRNode): string {
    const sourceId = node.meta.sourceId || node.id;

    // Build A2UI BoundValue props
    const boundProps: Record<string, BoundValue> = {};

    for (const [key, val] of Object.entries(node.props)) {
      boundProps[key] = valueToBoundValue(val);
    }

    // Add children as space-separated IDs
    if (node.children.length > 0) {
      const childIds: string[] = [];
      for (const child of node.children) {
        childIds.push(flattenNode(child));
      }
      boundProps.children = { literalString: childIds.join(" ") };
    }

    components.push({
      id: sourceId,
      component: { [node.type]: boundProps },
    });

    return sourceId;
  }

  flattenNode(doc.root);

  // 3. updateComponents
  messages.push({
    updateComponents: {
      surfaceId: doc.surface?.surfaceId || "main",
      components,
    },
  });

  // 4. updateDataModel (if any)
  if (Object.keys(doc.dataModel).length > 0) {
    messages.push({
      updateDataModel: {
        surfaceId: doc.surface?.surfaceId || "main",
        contents: doc.dataModel,
      },
    });
  }

  return messages;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function valueToBoundValue(val: IRValue): BoundValue {
  if (val === null) return { literalString: "" };
  if (typeof val === "string") return { literalString: val };
  if (typeof val === "number") return { literalNumber: val };
  if (typeof val === "boolean") return { literalBoolean: val };
  if (Array.isArray(val)) return { literalString: JSON.stringify(val) };
  if (typeof val === "object") {
    if ("__binding" in val) return { path: val.__binding.path };
    if ("__ref" in val) return { literalString: `ref:${val.__ref}` };
    if ("__expr" in val) return { literalString: `expr:${val.__expr}` };
  }
  return { literalString: String(val) };
}

function createEmptyRoot(format: "json-render" | "a2ui"): IRNode {
  return {
    id: generateNodeId(),
    type: "Card",
    props: { title: "New Component" },
    children: [],
    meta: {
      sourceFormat: format,
      originalPath: [],
      sourceId: "root",
      hasChildren: true,
    },
  };
}
