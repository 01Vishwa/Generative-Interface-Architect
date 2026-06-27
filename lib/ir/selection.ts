// ─── IR Selection & Path Utilities ───────────────────────────────────────────
// Path-based selection logic for navigating the IR tree.
// Used by the inspector breadcrumbs, canvas selection, and editor highlighting.

import type { IRNode } from "./types";

// ─── Path Finding ────────────────────────────────────────────────────────────

/**
 * Find the path from root to a specific node (by ID).
 * Returns an array of node IDs from root to the target.
 */
export function findNodePath(root: IRNode, targetId: string): string[] {
  const path: string[] = [];

  function search(node: IRNode): boolean {
    path.push(node.id);
    if (node.id === targetId) return true;

    for (const child of node.children) {
      if (search(child)) return true;
    }

    path.pop();
    return false;
  }

  search(root);
  return path;
}

/**
 * Find the path using source IDs (the original element IDs from the spec).
 * More useful for breadcrumbs since source IDs are human-readable.
 */
export function findSourceIdPath(root: IRNode, targetId: string): string[] {
  const path: string[] = [];

  function search(node: IRNode): boolean {
    path.push(node.meta.sourceId || node.id);
    if (node.id === targetId) return true;

    for (const child of node.children) {
      if (search(child)) return true;
    }

    path.pop();
    return false;
  }

  search(root);
  return path;
}

// ─── Node Queries ────────────────────────────────────────────────────────────

/**
 * Get all ancestor nodes of a given node (from root to immediate parent).
 */
export function getAncestors(root: IRNode, targetId: string): IRNode[] {
  const ancestors: IRNode[] = [];

  function search(node: IRNode): boolean {
    if (node.id === targetId) return true;

    for (const child of node.children) {
      if (search(child)) {
        ancestors.unshift(node);
        return true;
      }
    }

    return false;
  }

  search(root);
  return ancestors;
}

/**
 * Get all descendant nodes of a given node (flat list, depth-first).
 */
export function getDescendants(node: IRNode): IRNode[] {
  const result: IRNode[] = [];

  function collect(n: IRNode) {
    for (const child of n.children) {
      result.push(child);
      collect(child);
    }
  }

  collect(node);
  return result;
}

/**
 * Get all leaf nodes (nodes with no children).
 */
export function getLeafNodes(node: IRNode): IRNode[] {
  const result: IRNode[] = [];

  function collect(n: IRNode) {
    if (n.children.length === 0) {
      result.push(n);
    } else {
      for (const child of n.children) {
        collect(child);
      }
    }
  }

  collect(node);
  return result;
}

/**
 * Get all nodes of a specific type.
 */
export function getNodesByType(root: IRNode, type: string): IRNode[] {
  const result: IRNode[] = [];

  function collect(node: IRNode) {
    if (node.type === type) result.push(node);
    for (const child of node.children) {
      collect(child);
    }
  }

  collect(root);
  return result;
}

/**
 * Count all nodes in the tree.
 */
export function countNodes(root: IRNode): number {
  let count = 1;
  for (const child of root.children) {
    count += countNodes(child);
  }
  return count;
}

/**
 * Get the depth of a node in the tree.
 */
export function getNodeDepth(root: IRNode, targetId: string): number {
  function search(node: IRNode, depth: number): number {
    if (node.id === targetId) return depth;
    for (const child of node.children) {
      const found = search(child, depth + 1);
      if (found !== -1) return found;
    }
    return -1;
  }

  return search(root, 0);
}

// ─── Sibling Navigation ─────────────────────────────────────────────────────

/**
 * Get the next sibling of a node (or null if last/not found).
 */
export function getNextSibling(root: IRNode, nodeId: string): IRNode | null {
  const parent = findParent(root, nodeId);
  if (!parent) return null;

  const index = parent.children.findIndex((c) => c.id === nodeId);
  if (index === -1 || index >= parent.children.length - 1) return null;
  return parent.children[index + 1];
}

/**
 * Get the previous sibling of a node (or null if first/not found).
 */
export function getPreviousSibling(root: IRNode, nodeId: string): IRNode | null {
  const parent = findParent(root, nodeId);
  if (!parent) return null;

  const index = parent.children.findIndex((c) => c.id === nodeId);
  if (index <= 0) return null;
  return parent.children[index - 1];
}

/**
 * Find the parent of a node.
 */
function findParent(root: IRNode, childId: string): IRNode | null {
  for (const child of root.children) {
    if (child.id === childId) return root;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

// ─── Flat Map ────────────────────────────────────────────────────────────────

/**
 * Flatten the IR tree into a map of ID → node (for quick lookups).
 */
export function toFlatMap(root: IRNode): Map<string, IRNode> {
  const map = new Map<string, IRNode>();

  function collect(node: IRNode) {
    map.set(node.id, node);
    for (const child of node.children) {
      collect(child);
    }
  }

  collect(root);
  return map;
}

/**
 * Build a sourceId → nodeId mapping for bridging between
 * original format IDs and IR IDs.
 */
export function buildSourceIdMap(root: IRNode): Map<string, string> {
  const map = new Map<string, string>();

  function collect(node: IRNode) {
    if (node.meta.sourceId) {
      map.set(node.meta.sourceId, node.id);
    }
    for (const child of node.children) {
      collect(child);
    }
  }

  collect(root);
  return map;
}
