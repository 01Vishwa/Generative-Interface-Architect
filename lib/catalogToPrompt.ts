import { CatalogDefinition } from "./types";

/**
 * Generates a system prompt for an LLM to produce UI specs
 * constrained to the given catalog. Supports both json-render and a2ui formats.
 */
export function catalogToPrompt(
  catalog: CatalogDefinition,
  format: "json-render" | "a2ui"
): string {
  const catalogDescription = buildCatalogDescription(catalog);

  if (format === "json-render") {
    return `You are generating a json-render spec. Output ONLY valid JSON matching this exact schema.
No explanation, no markdown code fences, no commentary.

SPEC SHAPE:
{
  "root": "<id of the root element>",
  "elements": {
    "<id>": {
      "type": "<ComponentType>",
      "props": { ... },
      "children": ["<child-id>", ...]  // only for components with hasChildren: true
    }
  }
}

AVAILABLE COMPONENTS:
${catalogDescription}

RULES:
- Use only the component types listed above
- Props must exactly match the schema for each component type
- Children arrays reference IDs in the elements map
- The root field must reference an ID that exists in elements
- Generate meaningful, realistic placeholder content
- Use descriptive IDs like "revenue-card", "metrics-row", not "element-1"`;
  }

  return `You are generating an A2UI v0.9 message sequence. Output ONLY a valid JSON array of messages.
No explanation, no markdown code fences, no commentary.

MESSAGE SEQUENCE FORMAT:
[
  { "createSurface": { "surfaceId": "main", "catalogId": "basic" } },
  { "updateComponents": { "surfaceId": "main", "components": [
    { "id": "root", "component": { "ComponentType": { "propName": { "literalString": "value" } } } }
  ]}},
  { "updateDataModel": { "surfaceId": "main", "contents": { } } }
]

COMPONENT CATALOG:
${catalogDescription}

RULES:
- Always start with a createSurface message
- One component must have id "root"
- Prop values use BoundValue format: { "literalString": "..." } or { "literalNumber": 42 } or { "literalBoolean": true }
- For data-driven values use: { "path": "/data/model/path" } and populate updateDataModel accordingly
- Children reference IDs as space-separated strings in a "children" prop with literalString
- Use descriptive IDs like "revenue-card", "metrics-row"`;
}

function buildCatalogDescription(catalog: CatalogDefinition): string {
  const lines: string[] = [];

  for (const [name, def] of Object.entries(catalog.components)) {
    lines.push(`### ${name}`);
    lines.push(`Description: ${def.description}`);
    lines.push(`Has children: ${def.hasChildren}`);

    const propEntries = Object.entries(def.props);
    if (propEntries.length > 0) {
      lines.push("Props:");
      for (const [propName, propDef] of propEntries) {
        const req = propDef.required ? "(required)" : "(optional)";
        const vals = propDef.values ? ` — one of: ${propDef.values.join(", ")}` : "";
        lines.push(`  - ${propName}: ${propDef.type} ${req}${vals}`);
      }
    } else {
      lines.push("Props: none");
    }
    lines.push("");
  }

  return lines.join("\n");
}
