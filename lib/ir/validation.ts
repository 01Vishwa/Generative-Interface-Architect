// ─── IR Validation Engine ────────────────────────────────────────────────────
// Validates IR nodes against the component catalog schema.
// Used for editor gutter markers, inspector warnings, and export checks.

import type { IRNode, ValidationResult, ValidationSeverity, IRDocument } from "./types";
import { isBinding } from "./types";

// ─── Catalog Types (re-used from main types) ─────────────────────────────────

interface PropDefinition {
  type: "string" | "number" | "boolean" | "enum" | "string[]" | "string[][]";
  required: boolean;
  values?: string[];
  description?: string;
  defaultValue?: unknown;
}

interface ComponentDefinition {
  description: string;
  props: Record<string, PropDefinition>;
  hasChildren: boolean;
}

interface CatalogDefinition {
  components: Record<string, ComponentDefinition>;
}

// ─── Validation Functions ────────────────────────────────────────────────────

/**
 * Validate an entire IR document against a catalog.
 * Returns an array of validation results (errors, warnings, info).
 */
export function validateDocument(
  doc: IRDocument,
  catalog: CatalogDefinition
): ValidationResult[] {
  const results: ValidationResult[] = [];
  validateNode(doc.root, catalog, [], results);
  return results;
}

/**
 * Validate a single IR node and all its children recursively.
 */
export function validateNode(
  node: IRNode,
  catalog: CatalogDefinition,
  path: string[],
  results: ValidationResult[]
): void {
  const currentPath = [...path, node.meta.sourceId || node.id];
  const compDef = catalog.components[node.type];

  // Unknown component type
  if (!compDef) {
    results.push({
      nodeId: node.id,
      nodePath: currentPath,
      severity: "error",
      message: `Unknown component type: "${node.type}". Available types: ${Object.keys(catalog.components).join(", ")}`,
    });
    // Still validate children
    for (const child of node.children) {
      validateNode(child, catalog, currentPath, results);
    }
    return;
  }

  // Check required props
  for (const [propName, propDef] of Object.entries(compDef.props)) {
    if (propDef.required) {
      const value = node.props[propName];
      if (value === undefined || value === null || value === "") {
        results.push({
          nodeId: node.id,
          nodePath: currentPath,
          severity: "error",
          message: `Required prop "${propName}" is missing`,
          propName,
        });
      }
    }
  }

  // Check prop types
  for (const [propName, value] of Object.entries(node.props)) {
    const propDef = compDef.props[propName];

    if (!propDef) {
      // Unknown prop — warning, not error (might be intentional)
      results.push({
        nodeId: node.id,
        nodePath: currentPath,
        severity: "warning",
        message: `Unknown prop "${propName}" on ${node.type}`,
        propName,
      });
      continue;
    }

    // Skip binding validation (they resolve at runtime)
    if (typeof value === "object" && value !== null && isBinding(value)) {
      continue;
    }

    // Type validation
    const typeError = validatePropType(value, propDef, propName, node.type);
    if (typeError) {
      results.push({
        nodeId: node.id,
        nodePath: currentPath,
        severity: "error",
        message: typeError,
        propName,
      });
    }
  }

  // Children check
  if (node.children.length > 0 && !compDef.hasChildren) {
    results.push({
      nodeId: node.id,
      nodePath: currentPath,
      severity: "warning",
      message: `${node.type} does not accept children, but has ${node.children.length}`,
    });
  }

  // Validate children recursively
  for (const child of node.children) {
    validateNode(child, catalog, currentPath, results);
  }
}

/**
 * Validate a single prop value against its definition.
 * Returns an error message string, or null if valid.
 */
function validatePropType(
  value: unknown,
  propDef: PropDefinition,
  propName: string,
  componentType: string
): string | null {
  if (value === null || value === undefined) return null; // Handled by required check

  switch (propDef.type) {
    case "string":
      if (typeof value !== "string") {
        return `${componentType}.${propName} expects string, got ${typeof value}`;
      }
      break;

    case "number":
      if (typeof value !== "number") {
        return `${componentType}.${propName} expects number, got ${typeof value}`;
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return `${componentType}.${propName} expects boolean, got ${typeof value}`;
      }
      break;

    case "enum":
      if (typeof value !== "string") {
        return `${componentType}.${propName} expects one of [${propDef.values?.join(", ")}], got ${typeof value}`;
      }
      if (propDef.values && !propDef.values.includes(value)) {
        return `${componentType}.${propName}: "${value}" is not one of [${propDef.values.join(", ")}]`;
      }
      break;

    case "string[]":
      if (!Array.isArray(value)) {
        return `${componentType}.${propName} expects string[], got ${typeof value}`;
      }
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== "string") {
          return `${componentType}.${propName}[${i}] expects string, got ${typeof value[i]}`;
        }
      }
      break;

    case "string[][]":
      if (!Array.isArray(value)) {
        return `${componentType}.${propName} expects string[][], got ${typeof value}`;
      }
      for (let i = 0; i < value.length; i++) {
        if (!Array.isArray(value[i])) {
          return `${componentType}.${propName}[${i}] expects string[], got ${typeof value[i]}`;
        }
      }
      break;
  }

  return null;
}

// ─── Convenience Functions ───────────────────────────────────────────────────

/** Get validation results for a single node (non-recursive) */
export function validateSingleNode(
  node: IRNode,
  catalog: CatalogDefinition
): ValidationResult[] {
  const results: ValidationResult[] = [];
  // Run validation but don't recurse into children
  const compDef = catalog.components[node.type];
  if (!compDef) {
    results.push({
      nodeId: node.id,
      nodePath: [node.meta.sourceId],
      severity: "error",
      message: `Unknown component type: "${node.type}"`,
    });
    return results;
  }

  for (const [propName, propDef] of Object.entries(compDef.props)) {
    if (propDef.required) {
      const value = node.props[propName];
      if (value === undefined || value === null || value === "") {
        results.push({
          nodeId: node.id,
          nodePath: [node.meta.sourceId],
          severity: "error",
          message: `Required prop "${propName}" is missing`,
          propName,
        });
      }
    }
  }

  return results;
}

/** Count errors, warnings, and info messages */
export function countBySeverity(results: ValidationResult[]): Record<ValidationSeverity, number> {
  return {
    error: results.filter((r) => r.severity === "error").length,
    warning: results.filter((r) => r.severity === "warning").length,
    info: results.filter((r) => r.severity === "info").length,
  };
}
