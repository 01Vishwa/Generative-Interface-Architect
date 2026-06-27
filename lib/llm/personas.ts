// ─── LLM Personas — Prompt Engineering ───────────────────────────────────────
// Persona definitions with system prompts, model configs, and variable injection.

import type { CatalogDefinition } from "@/lib/types";
import { catalogToPrompt } from "@/lib/catalogToPrompt";
import type { IRNode } from "@/lib/ir/types";

// ─── Prompt Templates ────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "generate-ui",
    name: "Generate UI",
    description: "Generate a complete UI spec from a description",
    template: "{{catalog_prompt}}\n\nUser request: {{user_prompt}}",
    variables: ["catalog_prompt", "user_prompt"],
  },
  {
    id: "modify-component",
    name: "Modify Component",
    description: "Modify an existing component based on instructions",
    template:
      "{{catalog_prompt}}\n\nCurrent component ({{selected_type}}):\n```json\n{{selected_node}}\n```\n\nModification request: {{user_prompt}}",
    variables: ["catalog_prompt", "selected_type", "selected_node", "user_prompt"],
  },
  {
    id: "explain-spec",
    name: "Explain Spec",
    description: "Explain what a spec does in plain language",
    template:
      "You are a UI spec expert. Explain the following spec in plain language:\n\n```json\n{{current_spec}}\n```\n\nProvide a clear, concise explanation of what this UI looks like and how the components are structured.",
    variables: ["current_spec"],
  },
  {
    id: "optimize-spec",
    name: "Optimize Spec",
    description: "Optimize a spec for better component hierarchy",
    template:
      "{{catalog_prompt}}\n\nOptimize this UI spec for better component hierarchy, removing redundancy and improving structure. Return ONLY the optimized JSON spec.\n\nCurrent spec:\n```json\n{{current_spec}}\n```",
    variables: ["catalog_prompt", "current_spec"],
  },
];

// ─── Variable Injection ──────────────────────────────────────────────────────

export interface PromptVariables {
  user_prompt: string;
  catalog_prompt: string;
  current_spec: string;
  selected_node: string;
  selected_type: string;
  format: string;
}

/**
 * Build the full system prompt for a persona with catalog injection.
 */
export function buildSystemPrompt(
  catalog: CatalogDefinition,
  format: "json-render" | "a2ui"
): string {
  return catalogToPrompt(catalog, format);
}

/**
 * Inject variables into a prompt template.
 */
export function injectVariables(
  template: string,
  variables: Partial<PromptVariables>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

/**
 * Build prompt variables from the current editor state.
 */
export function buildPromptVariables(
  userPrompt: string,
  catalog: CatalogDefinition,
  format: "json-render" | "a2ui",
  currentSpec: string,
  selectedNode?: IRNode | null
): PromptVariables {
  return {
    user_prompt: userPrompt,
    catalog_prompt: buildSystemPrompt(catalog, format),
    current_spec: currentSpec,
    selected_node: selectedNode ? JSON.stringify(selectedNode, null, 2) : "",
    selected_type: selectedNode?.type || "",
    format,
  };
}
