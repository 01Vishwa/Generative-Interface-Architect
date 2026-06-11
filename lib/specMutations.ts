import { JsonRenderSpec, FormatType, CatalogDefinition } from "./types";
import { getDefaultProps } from "./catalog";

/**
 * Spec mutation functions. Each takes the parsed spec object
 * and returns a new spec object. The store handles re-serialization.
 */

let _idCounter = 0;
function generateId(type: string): string {
  _idCounter++;
  return `${type.toLowerCase()}-${Date.now().toString(36)}-${_idCounter}`;
}

// ─── json-render Mutations ───────────────────────────────────────────────────

export function insertElementJsonRender(
  spec: JsonRenderSpec,
  componentType: string,
  catalog: CatalogDefinition
): JsonRenderSpec {
  const id = generateId(componentType);
  const defaults = getDefaultProps(componentType);
  const compDef = catalog.components[componentType];

  const newElement: Record<string, unknown> = {
    type: componentType,
    props: { ...defaults },
  };
  if (compDef?.hasChildren) {
    newElement.children = [];
  }

  const newElements = { ...spec.elements, [id]: newElement as unknown as JsonRenderSpec["elements"][string] };

  // Try to add to root's children array if root has children
  const root = spec.elements[spec.root];
  if (root && Array.isArray(root.children)) {
    const updatedRoot = { ...root, children: [...root.children, id] };
    newElements[spec.root] = updatedRoot;
  }

  return { ...spec, elements: newElements };
}

export function deleteElementJsonRender(
  spec: JsonRenderSpec,
  elementId: string
): JsonRenderSpec {
  if (elementId === spec.root) return spec; // Can't delete root

  const newElements = { ...spec.elements };
  
  // Recursively collect all descendant IDs to delete
  const toDelete = new Set<string>();
  function collectDescendants(id: string) {
    toDelete.add(id);
    const el = newElements[id];
    if (el?.children) {
      for (const childId of el.children) {
        collectDescendants(childId);
      }
    }
  }
  collectDescendants(elementId);

  // Remove from all children arrays
  for (const [id, el] of Object.entries(newElements)) {
    if (!toDelete.has(id) && el.children) {
      newElements[id] = {
        ...el,
        children: el.children.filter((cid) => !toDelete.has(cid)),
      };
    }
  }

  // Delete the elements
  for (const id of toDelete) {
    delete newElements[id];
  }

  return { ...spec, elements: newElements };
}

export function updateElementPropsJsonRender(
  spec: JsonRenderSpec,
  elementId: string,
  newProps: Record<string, unknown>
): JsonRenderSpec {
  const el = spec.elements[elementId];
  if (!el) return spec;

  return {
    ...spec,
    elements: {
      ...spec.elements,
      [elementId]: {
        ...el,
        props: { ...el.props, ...newProps },
      },
    },
  };
}

export function reorderElementJsonRender(
  spec: JsonRenderSpec,
  parentId: string,
  oldIndex: number,
  newIndex: number
): JsonRenderSpec {
  const parent = spec.elements[parentId];
  if (!parent?.children) return spec;

  const children = [...parent.children];
  const [removed] = children.splice(oldIndex, 1);
  children.splice(newIndex, 0, removed);

  return {
    ...spec,
    elements: {
      ...spec.elements,
      [parentId]: { ...parent, children },
    },
  };
}

// ─── A2UI Mutations ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function insertElementA2UI(
  messages: any[],
  componentType: string,
  catalog: CatalogDefinition
): any[] {
  const id = generateId(componentType);
  const defaults = getDefaultProps(componentType);
  const newMessages = [...messages];

  // Build A2UI component with BoundValue props
  const componentProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(defaults)) {
    if (typeof val === "string") {
      componentProps[key] = { literalString: val };
    } else if (typeof val === "number") {
      componentProps[key] = { literalNumber: val };
    } else if (typeof val === "boolean") {
      componentProps[key] = { literalBoolean: val };
    }
  }

  const newComponent = {
    id,
    component: { [componentType]: componentProps },
  };

  // Find the last updateComponents message and add to it
  const ucIndex = newMessages.findLastIndex((m) => m.updateComponents);
  if (ucIndex !== -1) {
    const uc = newMessages[ucIndex];
    newMessages[ucIndex] = {
      ...uc,
      updateComponents: {
        ...uc.updateComponents,
        components: [...uc.updateComponents.components, newComponent],
      },
    };
  } else {
    // No updateComponents message — create one
    newMessages.push({
      updateComponents: {
        surfaceId: "main",
        components: [newComponent],
      },
    });
  }

  return newMessages;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deleteElementA2UI(messages: any[], elementId: string): any[] {
  return messages.map((msg) => {
    if (msg.updateComponents) {
      return {
        ...msg,
        updateComponents: {
          ...msg.updateComponents,
          components: msg.updateComponents.components.filter(
            (c: { id: string }) => c.id !== elementId
          ),
        },
      };
    }
    return msg;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateElementPropsA2UI(
  messages: any[],
  elementId: string,
  newProps: Record<string, unknown>
): any[] {
  return messages.map((msg) => {
    if (!msg.updateComponents) return msg;

    const components = msg.updateComponents.components.map((c: any) => {
      if (c.id !== elementId) return c;

      const compType = Object.keys(c.component)[0];
      const existingProps = c.component[compType] || {};
      const updatedProps = { ...existingProps };

      for (const [key, val] of Object.entries(newProps)) {
        if (typeof val === "string") {
          updatedProps[key] = { literalString: val };
        } else if (typeof val === "number") {
          updatedProps[key] = { literalNumber: val };
        } else if (typeof val === "boolean") {
          updatedProps[key] = { literalBoolean: val };
        } else if (Array.isArray(val)) {
          // For arrays, store as literalString with join
          updatedProps[key] = { literalString: JSON.stringify(val) };
        }
      }

      return {
        ...c,
        component: { [compType]: updatedProps },
      };
    });

    return {
      ...msg,
      updateComponents: { ...msg.updateComponents, components },
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Count elements in a spec regardless of format
 */
export function countElements(parsed: unknown, format: FormatType): number {
  if (!parsed) return 0;

  if (format === "json-render") {
    const spec = parsed as JsonRenderSpec;
    return spec.elements ? Object.keys(spec.elements).length : 0;
  }

  // A2UI: count components across all updateComponents messages
  const messages = parsed as any[];
  if (!Array.isArray(messages)) return 0;
  
  let count = 0;
  for (const msg of messages) {
    if (msg.updateComponents?.components) {
      count += msg.updateComponents.components.length;
    }
  }
  return count;
}

/**
 * Get all element IDs from a parsed spec
 */
export function getElementIds(parsed: unknown, format: FormatType): string[] {
  if (!parsed) return [];

  if (format === "json-render") {
    const spec = parsed as JsonRenderSpec;
    return spec.elements ? Object.keys(spec.elements) : [];
  }

  const messages = parsed as any[];
  if (!Array.isArray(messages)) return [];
  
  const ids: string[] = [];
  for (const msg of messages) {
    if (msg.updateComponents?.components) {
      for (const c of msg.updateComponents.components) {
        ids.push(c.id);
      }
    }
  }
  return ids;
}

/**
 * Find an element's data by ID in either format
 */
export function findElement(
  parsed: unknown,
  format: FormatType,
  elementId: string
): { type: string; props: Record<string, unknown> } | null {
  if (!parsed) return null;

  if (format === "json-render") {
    const spec = parsed as JsonRenderSpec;
    const el = spec.elements?.[elementId];
    if (!el) return null;
    return { type: el.type, props: el.props || {} };
  }

  const messages = parsed as any[];
  if (!Array.isArray(messages)) return null;

  for (const msg of messages) {
    if (msg.updateComponents?.components) {
      for (const c of msg.updateComponents.components) {
        if (c.id === elementId) {
          const compType = Object.keys(c.component)[0];
          const rawProps = c.component[compType] || {};
          // Resolve BoundValue props to plain values
          const props: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(rawProps) as [string, any][]) {
            if (val.literalString !== undefined) props[key] = val.literalString;
            else if (val.literalNumber !== undefined) props[key] = val.literalNumber;
            else if (val.literalBoolean !== undefined) props[key] = val.literalBoolean;
            else if (val.path !== undefined) props[key] = `{{${val.path}}}`;
            else props[key] = val;
          }
          return { type: compType, props };
        }
      }
    }
  }

  return null;
}

/**
 * Get the parent element ID and the nesting path for breadcrumbs
 */
export function getElementPath(
  parsed: unknown,
  format: FormatType,
  elementId: string
): string[] {
  if (!parsed || format !== "json-render") return [elementId];

  const spec = parsed as JsonRenderSpec;
  const path: string[] = [];

  function findPath(currentId: string, target: string): boolean {
    path.push(currentId);
    if (currentId === target) return true;

    const el = spec.elements[currentId];
    if (el?.children) {
      for (const childId of el.children) {
        if (findPath(childId, target)) return true;
      }
    }

    path.pop();
    return false;
  }

  findPath(spec.root, elementId);
  return path;
}

/**
 * Find which parent contains a given element ID in json-render
 */
export function findParentId(spec: JsonRenderSpec, elementId: string): string | null {
  for (const [id, el] of Object.entries(spec.elements)) {
    if (el.children?.includes(elementId)) {
      return id;
    }
  }
  return null;
}
