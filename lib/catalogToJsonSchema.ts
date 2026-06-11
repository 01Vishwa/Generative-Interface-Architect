import { CatalogDefinition } from "./types";

/**
 * Converts a CatalogDefinition into JSON Schema that Monaco can use
 * for validation and autocomplete. Generates different schemas for
 * json-render (object with root + elements map) vs a2ui (array of messages).
 */
export function catalogToJsonSchema(
  catalog: CatalogDefinition,
  format: "json-render" | "a2ui"
): Record<string, unknown> {
  if (format === "json-render") {
    return buildJsonRenderSchema(catalog);
  }
  return buildA2UISchema(catalog);
}

// ─── json-render Schema ──────────────────────────────────────────────────────

function buildJsonRenderSchema(catalog: CatalogDefinition): Record<string, unknown> {
  const definitions: Record<string, unknown> = {};

  for (const [typeName, def] of Object.entries(catalog.components)) {
    const required: string[] = [];
    const properties: Record<string, unknown> = {};

    for (const [propName, propDef] of Object.entries(def.props)) {
      if (propDef.required) required.push(propName);
      properties[propName] = propDefToJsonSchema(propDef);
    }

    const elementSchema: Record<string, unknown> = {
      type: "object",
      required: ["type", "props"],
      properties: {
        type: { type: "string", const: typeName },
        props: {
          type: "object",
          required: required.length > 0 ? required : undefined,
          properties,
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    };

    if (def.hasChildren) {
      (elementSchema.properties as Record<string, unknown>).children = {
        type: "array",
        items: { type: "string" },
        description: "Array of element IDs that are children of this component",
      };
    }

    definitions[typeName] = elementSchema;
  }

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["root", "elements"],
    properties: {
      root: {
        type: "string",
        description: "ID of the root element",
      },
      elements: {
        type: "object",
        additionalProperties: {
          oneOf: Object.keys(definitions).map((name) => ({
            $ref: `#/definitions/${name}`,
          })),
        },
        description: "Map of element IDs to element definitions",
      },
    },
    additionalProperties: false,
    definitions,
  };
}

// ─── A2UI Schema ─────────────────────────────────────────────────────────────

function buildA2UISchema(catalog: CatalogDefinition): Record<string, unknown> {
  const componentSchemas = Object.keys(catalog.components).map((typeName) => ({
    type: "object",
    properties: {
      [typeName]: { type: "object", additionalProperties: true },
    },
    required: [typeName],
    additionalProperties: false,
  }));

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "array",
    items: {
      oneOf: [
        {
          type: "object",
          properties: {
            createSurface: {
              type: "object",
              required: ["surfaceId", "catalogId"],
              properties: {
                surfaceId: { type: "string" },
                catalogId: { type: "string" },
              },
            },
          },
          required: ["createSurface"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            updateComponents: {
              type: "object",
              required: ["surfaceId", "components"],
              properties: {
                surfaceId: { type: "string" },
                components: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "component"],
                    properties: {
                      id: { type: "string" },
                      component: {
                        type: "object",
                        oneOf: componentSchemas,
                      },
                    },
                  },
                },
              },
            },
          },
          required: ["updateComponents"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            updateDataModel: {
              type: "object",
              required: ["surfaceId", "contents"],
              properties: {
                surfaceId: { type: "string" },
                contents: { type: "object", additionalProperties: true },
              },
            },
          },
          required: ["updateDataModel"],
          additionalProperties: false,
        },
      ],
    },
  };
}

// ─── Prop → JSON Schema Helpers ──────────────────────────────────────────────

function propDefToJsonSchema(prop: { type: string; values?: string[] }): Record<string, unknown> {
  switch (prop.type) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "enum":
      return { type: "string", enum: prop.values || [] };
    case "string[]":
      return { type: "array", items: { type: "string" } };
    case "string[][]":
      return { type: "array", items: { type: "array", items: { type: "string" } } };
    default:
      return {};
  }
}
