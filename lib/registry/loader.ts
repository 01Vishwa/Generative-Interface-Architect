// ─── Registry Loader ─────────────────────────────────────────────────────────
// Load components from local catalog, custom definitions, and npm packages.

import type { ComponentDefinition, CatalogDefinition } from "@/types/catalog";
import { DEFAULT_CATALOG } from "@/lib/catalog";

export type ComponentSource = "builtin" | "custom" | "npm";

export interface LoadedComponent {
  name: string;
  definition: ComponentDefinition;
  source: ComponentSource;
  version: string;
}

/**
 * Load the default built-in catalog.
 */
export function loadBuiltinCatalog(): LoadedComponent[] {
  return Object.entries(DEFAULT_CATALOG.components).map(([name, def]) => ({
    name,
    definition: { ...def, version: "1.0.0", tags: [], author: "GenUI" },
    source: "builtin" as const,
    version: "1.0.0",
  }));
}

/**
 * Load a custom catalog from a JSON/TS definition.
 */
export function loadCustomCatalog(catalogJson: string): LoadedComponent[] {
  try {
    const catalog: CatalogDefinition = JSON.parse(catalogJson);
    return Object.entries(catalog.components).map(([name, def]) => ({
      name,
      definition: { ...def, version: "1.0.0", tags: ["custom"], author: "Custom", isCustom: true },
      source: "custom" as const,
      version: "1.0.0",
    }));
  } catch (e) {
    console.error("Failed to parse custom catalog:", e);
    return [];
  }
}

/**
 * Merge multiple component lists, with later entries overriding earlier ones.
 */
export function mergeCatalogs(
  ...sources: LoadedComponent[][]
): Map<string, LoadedComponent> {
  const merged = new Map<string, LoadedComponent>();
  for (const source of sources) {
    for (const comp of source) {
      merged.set(comp.name, comp);
    }
  }
  return merged;
}

/**
 * Convert loaded components back to a CatalogDefinition.
 */
export function toCatalogDefinition(
  components: Map<string, LoadedComponent> | LoadedComponent[]
): CatalogDefinition {
  const entries = components instanceof Map
    ? Array.from(components.values())
    : components;

  const catalog: CatalogDefinition = { components: {} };
  for (const comp of entries) {
    catalog.components[comp.name] = comp.definition;
  }
  return catalog;
}
