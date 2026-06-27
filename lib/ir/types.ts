// ─── Intermediate Representation (IR) — Core Type System ─────────────────────
// The IR is the single source of truth. Both json-render and a2ui are parsed
// into IR, all tooling (DnD, validation, inspection, history) operates on IR,
// and the IR serializes back to the original format on export.

import { v4 as uuidv4 } from "uuid";

// ─── IR Value Types ──────────────────────────────────────────────────────────

/** A value that can be stored in an IR node's props */
export type IRValue =
  | string
  | number
  | boolean
  | null
  | IRValue[]
  | IRValue[][]
  | { __ref: string }       // Cross-node reference
  | { __expr: string }      // Unevaluated expression
  | { __binding: DataBinding }; // Data model binding

/** Data binding from a2ui's {{ /path }} syntax */
export interface DataBinding {
  path: string;          // e.g. "/revenue_formatted"
  resolvedValue?: unknown; // The value from the data model, if resolved
}

// ─── IR Node ─────────────────────────────────────────────────────────────────

/** Core IR node — every component in the tree becomes one of these */
export interface IRNode {
  /** Stable UUID, persists across edits */
  id: string;
  /** Component type (Button, Card, etc.) from the catalog */
  type: string;
  /** Normalized props — always plain values, never BoundValue wrappers */
  props: Record<string, IRValue>;
  /** Child nodes — always an array (even for a2ui which uses space-separated strings) */
  children: IRNode[];
  /** Metadata about the node's origin and bindings */
  meta: IRNodeMeta;
}

/** Metadata attached to each IR node */
export interface IRNodeMeta {
  /** Which format this node was parsed from */
  sourceFormat: "json-render" | "a2ui";
  /** JSON pointer path to the original location in the source document */
  originalPath: string[];
  /** Original element ID from the source format (preserved for round-trip) */
  sourceId: string;
  /** Data bindings for a2ui {{ /path }} references */
  dataBindings?: DataBinding[];
  /** Whether this node accepts children */
  hasChildren: boolean;
}

// ─── IR Document ─────────────────────────────────────────────────────────────

/** Root container for an IR document */
export interface IRDocument {
  /** The root node of the component tree */
  root: IRNode;
  /** Source format for serialization */
  sourceFormat: "json-render" | "a2ui";
  /** Data model (a2ui's updateDataModel contents) */
  dataModel: Record<string, unknown>;
  /** Surface metadata (a2ui's createSurface) */
  surface?: {
    surfaceId: string;
    catalogId: string;
  };
  /** Document metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
  };
}

// ─── Mutation Events (Event Sourcing) ────────────────────────────────────────

export type MutationType =
  | "INSERT_NODE"
  | "DELETE_NODE"
  | "MOVE_NODE"
  | "UPDATE_PROPS"
  | "REPARENT_NODE"
  | "SET_DOCUMENT"
  | "UPDATE_DATA_MODEL";

/** A single mutation event — append-only log for time-travel */
export interface MutationEvent {
  /** Unique event ID */
  id: string;
  /** Type of mutation */
  type: MutationType;
  /** Timestamp */
  timestamp: number;
  /** Human-readable description */
  description: string;
  /** The mutation payload */
  payload: MutationPayload;
  /** Inverse operation for undo */
  inverse?: MutationPayload;
  /** Branch this event belongs to (for variant exploration) */
  branchId: string;
}

export type MutationPayload =
  | { type: "INSERT_NODE"; parentId: string; index: number; node: IRNode }
  | { type: "DELETE_NODE"; nodeId: string; parentId: string; index: number; deletedNode: IRNode }
  | { type: "MOVE_NODE"; nodeId: string; fromParentId: string; fromIndex: number; toParentId: string; toIndex: number }
  | { type: "UPDATE_PROPS"; nodeId: string; prevProps: Record<string, IRValue>; nextProps: Record<string, IRValue> }
  | { type: "REPARENT_NODE"; nodeId: string; fromParentId: string; toParentId: string; index: number }
  | { type: "SET_DOCUMENT"; prevDocument: IRDocument | null; nextDocument: IRDocument }
  | { type: "UPDATE_DATA_MODEL"; prevModel: Record<string, unknown>; nextModel: Record<string, unknown> };

// ─── Branch (for variant exploration) ────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  parentBranchId: string | null;
  /** Index in the parent branch's event log where this branch diverged */
  forkPoint: number;
  createdAt: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  nodeId: string;
  nodePath: string[];
  severity: ValidationSeverity;
  message: string;
  propName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a stable UUID for new IR nodes */
export function generateNodeId(): string {
  return uuidv4();
}

/** Generate a readable ID from a component type (for human-friendly IDs) */
export function generateReadableId(type: string): string {
  const base = type.toLowerCase();
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

/** Type guard for __ref values */
export function isRef(value: IRValue): value is { __ref: string } {
  return typeof value === "object" && value !== null && "__ref" in value;
}

/** Type guard for __expr values */
export function isExpr(value: IRValue): value is { __expr: string } {
  return typeof value === "object" && value !== null && "__expr" in value;
}

/** Type guard for __binding values */
export function isBinding(value: IRValue): value is { __binding: DataBinding } {
  return typeof value === "object" && value !== null && "__binding" in value;
}
