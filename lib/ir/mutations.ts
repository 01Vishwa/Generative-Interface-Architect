// ─── IR Mutations ────────────────────────────────────────────────────────────
// Pure functions that operate on the IR tree. Each returns a new tree + a
// MutationEvent for event sourcing. Format-agnostic — works for both
// json-render and a2ui since they've been parsed into the same IR structure.

import { produce } from "immer";
import type { IRNode, IRValue, MutationEvent, MutationPayload, IRDocument } from "./types";
import { generateNodeId } from "./types";
import { v4 as uuidv4 } from "uuid";

// ─── Find Helpers ────────────────────────────────────────────────────────────

/** Find a node by ID anywhere in the tree */
export function findNodeById(root: IRNode, nodeId: string): IRNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
}

/** Find the parent of a node by the child's ID */
export function findParentNode(root: IRNode, nodeId: string): IRNode | null {
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    const found = findParentNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

/** Get the index of a child within its parent's children array */
export function findChildIndex(parent: IRNode, childId: string): number {
  return parent.children.findIndex((c) => c.id === childId);
}

/** Deep clone an IR node (for undo snapshots) */
export function cloneNode(node: IRNode): IRNode {
  return {
    ...node,
    props: { ...node.props },
    children: node.children.map(cloneNode),
    meta: { ...node.meta, dataBindings: node.meta.dataBindings ? [...node.meta.dataBindings] : undefined },
  };
}

// ─── Create Event Helper ─────────────────────────────────────────────────────

function createEvent(
  type: MutationEvent["type"],
  description: string,
  payload: MutationPayload,
  branchId: string = "main"
): MutationEvent {
  return {
    id: uuidv4(),
    type,
    timestamp: Date.now(),
    description,
    payload,
    branchId,
  };
}

// ─── Insert Node ─────────────────────────────────────────────────────────────

export interface InsertNodeResult {
  document: IRDocument;
  event: MutationEvent;
  insertedNodeId: string;
}

/**
 * Insert a new node as a child of the given parent.
 * If no parentId given, inserts into root.
 * If no index given, appends at end.
 */
export function insertNode(
  doc: IRDocument,
  newNode: IRNode,
  parentId?: string,
  index?: number,
  branchId?: string
): InsertNodeResult {
  const targetParentId = parentId || doc.root.id;
  const finalIndex = index ?? -1; // -1 = append

  const nextDocument = produce(doc, (draft) => {
    const parent = findNodeInDraft(draft.root, targetParentId);
    if (!parent) return;

    const insertAt = finalIndex === -1 ? parent.children.length : finalIndex;
    parent.children.splice(insertAt, 0, newNode);
    draft.metadata.updatedAt = Date.now();
    draft.metadata.version++;
  });

  const actualIndex = finalIndex === -1
    ? (findNodeById(nextDocument.root, targetParentId)?.children.length ?? 1) - 1
    : finalIndex;

  const event = createEvent(
    "INSERT_NODE",
    `Insert ${newNode.type} into ${targetParentId}`,
    {
      type: "INSERT_NODE",
      parentId: targetParentId,
      index: actualIndex,
      node: cloneNode(newNode),
    },
    branchId
  );

  return { document: nextDocument, event, insertedNodeId: newNode.id };
}

// ─── Delete Node ─────────────────────────────────────────────────────────────

export interface DeleteNodeResult {
  document: IRDocument;
  event: MutationEvent;
}

/**
 * Delete a node by ID. Cannot delete the root node.
 * Also removes all descendants.
 */
export function deleteNode(
  doc: IRDocument,
  nodeId: string,
  branchId?: string
): DeleteNodeResult {
  if (nodeId === doc.root.id) {
    return { document: doc, event: createEvent("DELETE_NODE", "Cannot delete root", { type: "DELETE_NODE", nodeId, parentId: "", index: -1, deletedNode: doc.root }, branchId) };
  }

  const parent = findParentNode(doc.root, nodeId);
  const node = findNodeById(doc.root, nodeId);
  if (!parent || !node) {
    return { document: doc, event: createEvent("DELETE_NODE", "Node not found", { type: "DELETE_NODE", nodeId, parentId: "", index: -1, deletedNode: node || doc.root }, branchId) };
  }

  const index = findChildIndex(parent, nodeId);
  const deletedNode = cloneNode(node);

  const nextDocument = produce(doc, (draft) => {
    const draftParent = findNodeInDraft(draft.root, parent.id);
    if (!draftParent) return;
    draftParent.children = draftParent.children.filter((c) => c.id !== nodeId);
    draft.metadata.updatedAt = Date.now();
    draft.metadata.version++;
  });

  const event = createEvent(
    "DELETE_NODE",
    `Delete ${node.type} from ${parent.id}`,
    {
      type: "DELETE_NODE",
      nodeId,
      parentId: parent.id,
      index,
      deletedNode,
    },
    branchId
  );

  return { document: nextDocument, event };
}

// ─── Move Node (reorder within same parent) ──────────────────────────────────

export interface MoveNodeResult {
  document: IRDocument;
  event: MutationEvent;
}

/**
 * Move a node from one position to another.
 * Supports moving within the same parent or between parents.
 */
export function moveNode(
  doc: IRDocument,
  nodeId: string,
  toParentId: string,
  toIndex: number,
  branchId?: string
): MoveNodeResult {
  const fromParent = findParentNode(doc.root, nodeId);
  if (!fromParent) {
    return { document: doc, event: createEvent("MOVE_NODE", "Node not found", { type: "MOVE_NODE", nodeId, fromParentId: "", fromIndex: -1, toParentId, toIndex }, branchId) };
  }

  const fromIndex = findChildIndex(fromParent, nodeId);

  const nextDocument = produce(doc, (draft) => {
    const draftFromParent = findNodeInDraft(draft.root, fromParent.id);
    if (!draftFromParent) return;

    // Remove from source
    const [movedNode] = draftFromParent.children.splice(fromIndex, 1);
    if (!movedNode) return;

    // Insert at target
    const draftToParent = findNodeInDraft(draft.root, toParentId);
    if (!draftToParent) return;

    const adjustedIndex = fromParent.id === toParentId && fromIndex < toIndex
      ? toIndex - 1
      : toIndex;

    draftToParent.children.splice(adjustedIndex, 0, movedNode);
    draft.metadata.updatedAt = Date.now();
    draft.metadata.version++;
  });

  const event = createEvent(
    "MOVE_NODE",
    `Move node to index ${toIndex}`,
    {
      type: "MOVE_NODE",
      nodeId,
      fromParentId: fromParent.id,
      fromIndex,
      toParentId,
      toIndex,
    },
    branchId
  );

  return { document: nextDocument, event };
}

// ─── Update Props ────────────────────────────────────────────────────────────

export interface UpdatePropsResult {
  document: IRDocument;
  event: MutationEvent;
}

/**
 * Update one or more props on a node.
 * Merges with existing props (doesn't replace all props).
 */
export function updateNodeProps(
  doc: IRDocument,
  nodeId: string,
  newProps: Record<string, IRValue>,
  branchId?: string
): UpdatePropsResult {
  const node = findNodeById(doc.root, nodeId);
  if (!node) {
    return {
      document: doc,
      event: createEvent("UPDATE_PROPS", "Node not found", { type: "UPDATE_PROPS", nodeId, prevProps: {}, nextProps: newProps }, branchId),
    };
  }

  const prevProps: Record<string, IRValue> = {};
  for (const key of Object.keys(newProps)) {
    prevProps[key] = node.props[key];
  }

  const nextDocument = produce(doc, (draft) => {
    const draftNode = findNodeInDraft(draft.root, nodeId);
    if (!draftNode) return;
    Object.assign(draftNode.props, newProps);
    draft.metadata.updatedAt = Date.now();
    draft.metadata.version++;
  });

  const event = createEvent(
    "UPDATE_PROPS",
    `Update ${Object.keys(newProps).join(", ")} on ${node.type}`,
    {
      type: "UPDATE_PROPS",
      nodeId,
      prevProps,
      nextProps: newProps,
    },
    branchId
  );

  return { document: nextDocument, event };
}

// ─── Set Document (wholesale replace) ────────────────────────────────────────

export interface SetDocumentResult {
  document: IRDocument;
  event: MutationEvent;
}

/**
 * Replace the entire document (e.g., when loading from file or LLM generation).
 */
export function setDocument(
  prevDoc: IRDocument | null,
  nextDoc: IRDocument,
  branchId?: string
): SetDocumentResult {
  const event = createEvent(
    "SET_DOCUMENT",
    "Set document",
    {
      type: "SET_DOCUMENT",
      prevDocument: prevDoc,
      nextDocument: nextDoc,
    },
    branchId
  );

  return { document: nextDoc, event };
}

// ─── Create Default Node ─────────────────────────────────────────────────────

/**
 * Create a new IR node with default props for a given component type.
 * Uses the catalog's default values.
 */
export function createDefaultNode(
  type: string,
  defaultProps: Record<string, unknown>,
  hasChildren: boolean,
  sourceFormat: "json-render" | "a2ui" = "json-render"
): IRNode {
  const normalizedProps: Record<string, IRValue> = {};
  for (const [key, val] of Object.entries(defaultProps)) {
    if (typeof val === "string") normalizedProps[key] = val;
    else if (typeof val === "number") normalizedProps[key] = val;
    else if (typeof val === "boolean") normalizedProps[key] = val;
    else if (Array.isArray(val)) normalizedProps[key] = val as IRValue[];
    else if (val === null || val === undefined) normalizedProps[key] = null;
    else normalizedProps[key] = JSON.stringify(val);
  }

  const sourceId = `${type.toLowerCase()}-${Date.now().toString(36).slice(-4)}`;

  return {
    id: generateNodeId(),
    type,
    props: normalizedProps,
    children: [],
    meta: {
      sourceFormat,
      originalPath: [],
      sourceId,
      hasChildren,
    },
  };
}

// ─── Immer-compatible find ───────────────────────────────────────────────────

/** Find a node in a draft (mutable) tree — works with Immer */
function findNodeInDraft(root: IRNode, nodeId: string): IRNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeInDraft(child, nodeId);
    if (found) return found;
  }
  return null;
}
