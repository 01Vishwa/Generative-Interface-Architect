// ─── Core Types for GenUI Playground ─────────────────────────────────────────

export type FormatType = "json-render" | "a2ui";

// ─── Catalog Definition ──────────────────────────────────────────────────────

export type PropType = "string" | "number" | "boolean" | "enum" | "string[]" | "string[][]";

export interface PropDefinition {
  type: PropType;
  required: boolean;
  values?: string[];           // for enum type
  description?: string;
  defaultValue?: unknown;
}

export interface ComponentDefinition {
  description: string;
  props: Record<string, PropDefinition>;
  hasChildren: boolean;
}

export interface CatalogDefinition {
  components: Record<string, ComponentDefinition>;
}

// ─── json-render Spec Types ──────────────────────────────────────────────────

export interface JsonRenderElement {
  type: string;
  props: Record<string, unknown>;
  children?: string[];
}

export interface JsonRenderSpec {
  root: string;
  elements: Record<string, JsonRenderElement>;
}

// ─── A2UI Spec Types ─────────────────────────────────────────────────────────

export type BoundValue =
  | { literalString: string }
  | { literalNumber: number }
  | { literalBoolean: boolean }
  | { path: string };

export interface A2UIComponent {
  id: string;
  component: Record<string, Record<string, BoundValue | { literalString: string }>>;
}

export interface A2UICreateSurface {
  createSurface: { surfaceId: string; catalogId: string };
}

export interface A2UIUpdateComponents {
  updateComponents: {
    surfaceId: string;
    components: A2UIComponent[];
  };
}

export interface A2UIUpdateDataModel {
  updateDataModel: {
    surfaceId: string;
    contents: Record<string, unknown>;
  };
}

export type A2UIMessage = A2UICreateSurface | A2UIUpdateComponents | A2UIUpdateDataModel;

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  text: string;
  format: FormatType;
  componentCount: number;
  byteSize: number;
  starred: boolean;
}

// ─── Export Formats ──────────────────────────────────────────────────────────

export type ExportFormat =
  | "json"
  | "llm-prompt"
  | "catalog-ts"
  | "a2ui-jsonl"
  | "share-url"
  | "react-component";
