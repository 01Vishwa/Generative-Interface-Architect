// ─── Registry Compiler ───────────────────────────────────────────────────────
// Compiles custom component definitions from TSX source into CatalogEntry.
// Uses in-browser analysis (no bundler required) for lightweight compilation.

import type { ComponentDefinition, PropSchema, PropType } from "@/types/catalog";

export interface CompilerResult {
  success: boolean;
  definition?: ComponentDefinition;
  errors: string[];
  warnings: string[];
}

/**
 * Compile a TypeScript/TSX component source into a CatalogEntry definition.
 * Extracts props interface, description, and metadata from JSDoc comments.
 */
export function compileComponentSource(
  name: string,
  source: string
): CompilerResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate component name
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    errors.push(`Component name "${name}" must be PascalCase`);
  }

  // Extract props interface from source
  const props = extractPropsFromSource(source);
  if (!props && source.includes("props")) {
    warnings.push("Could not extract props interface — using empty props");
  }

  // Extract description from JSDoc
  const description = extractJSDocDescription(source) || `Custom ${name} component`;

  // Detect if component accepts children
  const hasChildren =
    source.includes("children") &&
    (source.includes("props.children") ||
      source.includes("{children}") ||
      source.includes("{ children }"));

  const definition: ComponentDefinition = {
    description,
    props: props || {},
    hasChildren,
    version: "1.0.0",
    tags: ["custom"],
    author: "Custom",
    icon: "box",
    isCustom: true,
  };

  return {
    success: errors.length === 0,
    definition: errors.length === 0 ? definition : undefined,
    errors,
    warnings,
  };
}

/**
 * Extract props from TypeScript interface/type in source code.
 * Handles common patterns: `interface FooProps { ... }` and `type FooProps = { ... }`
 */
function extractPropsFromSource(source: string): Record<string, PropSchema> | null {
  // Match interface FooProps { ... } or type FooProps = { ... }
  const interfaceMatch = source.match(
    /(?:interface|type)\s+\w*Props\s*=?\s*\{([^}]+)\}/s
  );

  if (!interfaceMatch) return null;

  const body = interfaceMatch[1];
  const props: Record<string, PropSchema> = {};

  // Parse each line of the interface
  const lines = body.split(/[;\n]/).filter((l) => l.trim());

  for (const line of lines) {
    const propMatch = line.trim().match(
      /^\s*\/?\*?\s*(\w+)(\??):\s*(.+?)\s*$/
    );

    if (!propMatch) continue;

    const [, propName, optional, typeStr] = propMatch;
    const required = optional !== "?";
    const propType = mapTypeScriptType(typeStr.trim());

    if (propType) {
      props[propName] = {
        type: propType.type,
        required,
        description: `${propName} prop`,
        ...(propType.values ? { values: propType.values } : {}),
      };
    }
  }

  return Object.keys(props).length > 0 ? props : null;
}

/**
 * Map TypeScript type annotation to our PropType.
 */
function mapTypeScriptType(
  tsType: string
): { type: PropType; values?: string[] } | null {
  const cleaned = tsType.replace(/\/\/.*$/, "").trim();

  if (cleaned === "string") return { type: "string" };
  if (cleaned === "number") return { type: "number" };
  if (cleaned === "boolean") return { type: "boolean" };
  if (cleaned === "string[]") return { type: "string[]" };

  // Union of string literals → enum
  const unionMatch = cleaned.match(/^["'](.+?)["'](?:\s*\|\s*["'](.+?)["'])*$/);
  if (unionMatch) {
    const values = cleaned
      .split("|")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    return { type: "enum", values };
  }

  // React.ReactNode, ReactNode → skip (children)
  if (cleaned.includes("ReactNode") || cleaned.includes("React.ReactNode")) {
    return null;
  }

  // Fallback to string
  return { type: "string" };
}

/**
 * Extract description from JSDoc comment above the component.
 */
function extractJSDocDescription(source: string): string | null {
  const jsdocMatch = source.match(
    /\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/
  );

  return jsdocMatch ? jsdocMatch[1].replace(/^\*\s*/, "").trim() : null;
}

/**
 * Generate a minimal CatalogEntry JSON from a component definition.
 * Used for importing custom components into the registry.
 */
export function definitionToJSON(
  name: string,
  definition: ComponentDefinition
): string {
  return JSON.stringify(
    {
      [name]: {
        description: definition.description,
        props: definition.props,
        hasChildren: definition.hasChildren,
        version: definition.version,
        tags: definition.tags,
        author: definition.author,
      },
    },
    null,
    2
  );
}
