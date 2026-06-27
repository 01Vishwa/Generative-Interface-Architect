// ─── Enhanced Catalog Types ──────────────────────────────────────────────────
// Extended component definitions with versioning, tags, and design token support.

export type PropType = "string" | "number" | "boolean" | "enum" | "string[]" | "string[][]" | "color" | "spacing" | "token";

export interface PropSchema {
  type: PropType;
  required: boolean;
  values?: string[];
  description?: string;
  defaultValue?: unknown;
  /** Design token reference (e.g., "color.primary.500") */
  tokenRef?: string;
  /** Validation constraints */
  min?: number;
  max?: number;
  pattern?: string;
}

export interface ComponentDefinition {
  description: string;
  props: Record<string, PropSchema>;
  hasChildren: boolean;
  /** Component version (semver) */
  version?: string;
  /** Searchable tags */
  tags?: string[];
  /** Author name */
  author?: string;
  /** Icon identifier (lucide icon name) */
  icon?: string;
  /** Whether this is a custom/user-defined component */
  isCustom?: boolean;
  /** npm package this component comes from */
  npmPackage?: string;
  /** Deprecated flag */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
}

export interface CatalogDefinition {
  components: Record<string, ComponentDefinition>;
  /** Catalog metadata */
  metadata?: {
    name: string;
    version: string;
    description?: string;
    author?: string;
  };
}

// ─── Design Tokens ───────────────────────────────────────────────────────────

export type TokenCategory = "color" | "spacing" | "typography" | "shadow" | "radius" | "border";

export interface DesignToken {
  name: string;
  category: TokenCategory;
  value: string;
  /** CSS variable name (e.g., "--color-primary-500") */
  cssVariable: string;
  /** Human-readable label */
  label?: string;
  /** Group within category (e.g., "primary", "neutral") */
  group?: string;
}

export interface DesignTokenCollection {
  tokens: DesignToken[];
  metadata: {
    name: string;
    version: string;
  };
}
