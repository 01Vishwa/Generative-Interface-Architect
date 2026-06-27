// ─── Workspace Types ─────────────────────────────────────────────────────────
// Types for workspace persistence, sharing, and export.

import type { FormatType } from "@/lib/types";
import type { IRDocument } from "@/lib/ir/types";

export interface Workspace {
  id: string;
  name: string;
  /** The current IR document */
  irDocument: IRDocument | null;
  /** Raw text (serialized spec) */
  rawText: string;
  /** Active format */
  format: FormatType;
  /** Workspace settings */
  settings: WorkspaceSettings;
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
  /** Whether this workspace is shared */
  isShared: boolean;
  /** Share link ID (if shared) */
  shareId?: string;
}

export interface WorkspaceSettings {
  /** Active LLM persona */
  persona: string;
  /** Panel layout sizes (percentages) */
  panelSizes: [number, number, number];
  /** Auto-save interval (ms, 0 = disabled) */
  autoSaveInterval: number;
  /** Theme override (null = use global) */
  themeOverride: "light" | "dark" | null;
  /** Show validation in editor gutter */
  showValidation: boolean;
  /** Show minimap in Monaco */
  showMinimap: boolean;
}

export interface ShareLink {
  id: string;
  workspaceId: string;
  createdAt: number;
  expiresAt?: number;
  /** Encoded spec data */
  payload: string;
  /** Access level */
  access: "view" | "edit" | "fork";
}

export type ExportFormat =
  | "json"
  | "llm-prompt"
  | "catalog-ts"
  | "a2ui-jsonl"
  | "share-url"
  | "react-component"
  | "html-standalone"
  | "figma-tokens"
  | "css-variables";

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  persona: "genui-architect",
  panelSizes: [30, 40, 30],
  autoSaveInterval: 2000,
  themeOverride: null,
  showValidation: true,
  showMinimap: false,
};
