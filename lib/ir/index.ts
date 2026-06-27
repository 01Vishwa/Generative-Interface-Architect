// ─── IR Module Barrel Export ─────────────────────────────────────────────────
// Re-exports all IR types, adapters, mutations, validation, and selection.

export * from "./types";
export * from "./mutations";
export * from "./validation";
export * from "./selection";
export { parseJsonRender, serializeToJsonRender } from "./adapters/json-render";
export { parseA2UI, serializeToA2UI } from "./adapters/a2ui";
