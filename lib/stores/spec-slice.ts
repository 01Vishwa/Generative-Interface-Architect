/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateCreator } from "zustand";
import { StoreState } from "./index";
import { FormatType, CatalogDefinition, JsonRenderSpec } from "../types";
import { DEFAULT_CATALOG } from "../catalog";
import { DEFAULT_JSON_RENDER_SPEC, DEFAULT_A2UI_SPEC } from "../defaultSpecs";
import {
  insertElementJsonRender,
  deleteElementJsonRender,
  updateElementPropsJsonRender,
  reorderElementJsonRender,
  insertElementA2UI,
  deleteElementA2UI,
  updateElementPropsA2UI,
  reorderElementA2UI,
  findElement,
} from "../specMutations";

export interface SpecSlice {
  format: FormatType;
  rawText: string;
  parsedSpec: unknown | null;
  validationErrors: number;
  selectedElementId: string | null;
  catalog: CatalogDefinition;

  setFormat: (format: FormatType) => void;
  setRawText: (text: string) => void;
  setParsedSpec: (spec: unknown | null) => void;
  setValidationErrors: (count: number) => void;
  selectElement: (id: string | null) => void;
  insertElement: (componentType: string) => void;
  deleteElement: (id: string) => void;
  updateElementProps: (id: string, newProps: Record<string, unknown>) => void;
  reorderElement: (parentId: string, oldIndex: number, newIndex: number) => void;
  importCatalog: (catalog: CatalogDefinition) => void;

  getSelectedElement: () => { type: string; props: Record<string, unknown> } | null;
}

export const createSpecSlice: StateCreator<StoreState, [], [], SpecSlice> = (set, get) => ({
  format: "json-render",
  rawText: DEFAULT_JSON_RENDER_SPEC,
  parsedSpec: JSON.parse(DEFAULT_JSON_RENDER_SPEC),
  validationErrors: 0,
  selectedElementId: null,
  catalog: DEFAULT_CATALOG,

  setFormat: (format) => {
    const text = format === "json-render" ? DEFAULT_JSON_RENDER_SPEC : DEFAULT_A2UI_SPEC;
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    set({
      format,
      rawText: text,
      parsedSpec: parsed,
      selectedElementId: null,
      validationErrors: 0,
    });
  },

  setRawText: (text) => set({ rawText: text }),

  setParsedSpec: (spec) => set({ parsedSpec: spec }),

  setValidationErrors: (count) => set({ validationErrors: count }),

  selectElement: (id) => set({ selectedElementId: id }),

  insertElement: (componentType) => {
    const { parsedSpec, format, catalog } = get();
    if (!parsedSpec) return;

    let newSpec: unknown;
    if (format === "json-render") {
      newSpec = insertElementJsonRender(parsedSpec as JsonRenderSpec, componentType, catalog);
    } else {
      newSpec = insertElementA2UI(parsedSpec as any[], componentType, catalog);
    }

    const newText = JSON.stringify(newSpec, null, 2);
    set({ parsedSpec: newSpec, rawText: newText });
  },

  deleteElement: (id) => {
    const { parsedSpec, format } = get();
    if (!parsedSpec) return;

    let newSpec: unknown;
    if (format === "json-render") {
      newSpec = deleteElementJsonRender(parsedSpec as JsonRenderSpec, id);
    } else {
      newSpec = deleteElementA2UI(parsedSpec as any[], id);
    }

    const newText = JSON.stringify(newSpec, null, 2);
    set({ parsedSpec: newSpec, rawText: newText, selectedElementId: null });
  },

  updateElementProps: (id, newProps) => {
    const { parsedSpec, format } = get();
    if (!parsedSpec) return;

    let newSpec: unknown;
    if (format === "json-render") {
      newSpec = updateElementPropsJsonRender(parsedSpec as JsonRenderSpec, id, newProps);
    } else {
      newSpec = updateElementPropsA2UI(parsedSpec as any[], id, newProps);
    }

    const newText = JSON.stringify(newSpec, null, 2);
    set({ parsedSpec: newSpec, rawText: newText });
  },

  reorderElement: (parentId, oldIndex, newIndex) => {
    const { parsedSpec, format } = get();
    if (!parsedSpec) return;

    let newSpec: unknown;
    if (format === "json-render") {
      newSpec = reorderElementJsonRender(
        parsedSpec as JsonRenderSpec,
        parentId,
        oldIndex,
        newIndex
      );
    } else {
      newSpec = reorderElementA2UI(parsedSpec as any[], parentId, oldIndex, newIndex);
    }
    
    const newText = JSON.stringify(newSpec, null, 2);
    set({ parsedSpec: newSpec, rawText: newText });
  },

  importCatalog: (catalog) => set({ catalog }),

  getSelectedElement: () => {
    const { parsedSpec, format, selectedElementId } = get();
    if (!parsedSpec || !selectedElementId) return null;
    return findElement(parsedSpec, format, selectedElementId);
  },
});
