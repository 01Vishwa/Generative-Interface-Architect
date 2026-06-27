// ─── Registry Validator ──────────────────────────────────────────────────────
// Validates that custom component definitions match the expected schema.

import type { ComponentDefinition, PropSchema } from "@/types/catalog";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a component definition.
 * Returns an array of errors (empty if valid).
 */
export function validateComponentDefinition(
  name: string,
  definition: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];
  const def = definition as Record<string, unknown>;

  if (!def || typeof def !== "object") {
    errors.push({ field: "root", message: "Definition must be an object" });
    return errors;
  }

  // Name validation
  if (!name || typeof name !== "string") {
    errors.push({ field: "name", message: "Component name is required and must be a string" });
  } else if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    errors.push({ field: "name", message: "Component name must be PascalCase (e.g., MyComponent)" });
  }

  // Description
  if (!def.description || typeof def.description !== "string") {
    errors.push({ field: "description", message: "Description is required" });
  }

  // hasChildren
  if (typeof def.hasChildren !== "boolean") {
    errors.push({ field: "hasChildren", message: "hasChildren must be a boolean" });
  }

  // Props
  if (!def.props || typeof def.props !== "object") {
    errors.push({ field: "props", message: "Props must be an object" });
  } else {
    const props = def.props as Record<string, unknown>;
    for (const [propName, propDef] of Object.entries(props)) {
      const propErrors = validatePropDefinition(propName, propDef);
      errors.push(...propErrors);
    }
  }

  return errors;
}

function validatePropDefinition(name: string, definition: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const def = definition as Record<string, unknown>;

  if (!def || typeof def !== "object") {
    errors.push({ field: `props.${name}`, message: `Prop "${name}" must be an object` });
    return errors;
  }

  const validTypes = ["string", "number", "boolean", "enum", "string[]", "string[][]", "color", "spacing", "token"];
  if (!def.type || !validTypes.includes(def.type as string)) {
    errors.push({
      field: `props.${name}.type`,
      message: `Prop "${name}" has invalid type "${def.type}". Must be one of: ${validTypes.join(", ")}`,
    });
  }

  if (typeof def.required !== "boolean") {
    errors.push({
      field: `props.${name}.required`,
      message: `Prop "${name}" must have a required boolean field`,
    });
  }

  // Enum validation
  if (def.type === "enum" && (!Array.isArray(def.values) || def.values.length === 0)) {
    errors.push({
      field: `props.${name}.values`,
      message: `Enum prop "${name}" must have a non-empty values array`,
    });
  }

  return errors;
}

/**
 * Validate a full catalog definition.
 */
export function validateCatalog(catalog: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const cat = catalog as Record<string, unknown>;

  if (!cat || typeof cat !== "object") {
    errors.push({ field: "root", message: "Catalog must be an object" });
    return errors;
  }

  if (!cat.components || typeof cat.components !== "object") {
    errors.push({ field: "components", message: "Catalog must have a components object" });
    return errors;
  }

  const components = cat.components as Record<string, unknown>;
  for (const [name, def] of Object.entries(components)) {
    errors.push(...validateComponentDefinition(name, def));
  }

  return errors;
}
