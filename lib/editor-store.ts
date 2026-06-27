// ─── Editor Store — Backward Compatible Facade ──────────────────────────────
// This file provides a backward-compatible `useEditorStore` hook that wraps
// the new store architecture. Existing components can continue using it while
// migration to the new stores happens incrementally.

import { useSpecStore } from "./store/useSpecStore";
import { useUIStore } from "./store/useUIStore";
import { useLLMStore } from "./store/useLLMStore";
import { useRegistryStore } from "./store/useRegistryStore";
import type { CatalogDefinition } from "./types";
import type { IRValue } from "./ir/types";
import { findNodeById } from "./ir/mutations";

/**
 * Backward-compatible hook that combines all stores into a single interface.
 * Components can migrate to individual stores gradually.
 */
export function useEditorStore() {
  const spec = useSpecStore();
  const ui = useUIStore();
  const llm = useLLMStore();
  const registry = useRegistryStore();

  return {
    // ─── Spec State ─────────────────────────────────────────────────────
    rawText: spec.rawText,
    parsedSpec: spec.parsedSpec,
    format: spec.format,
    validationErrors: spec.validationErrors,
    selectedElementId: spec.selectedNodeId,
    catalog: spec.catalog,
    irDocument: spec.irDocument,

    // ─── Spec Actions ───────────────────────────────────────────────────
    setRawText: spec.setRawText,
    setParsedSpec: spec.setParsedSpec,
    setFormat: spec.setFormat,
    setValidationErrors: spec.setValidationErrors,
    selectElement: spec.selectNode,
    insertElement: (componentType: string) => spec.insertComponent(componentType),
    deleteElement: (id: string) => spec.deleteComponent(id),
    updateElementProps: (id: string, props: Record<string, unknown>) => {
      const irProps: Record<string, IRValue> = {};
      for (const [key, val] of Object.entries(props)) {
        if (typeof val === "string") irProps[key] = val;
        else if (typeof val === "number") irProps[key] = val;
        else if (typeof val === "boolean") irProps[key] = val;
        else if (val === null || val === undefined) irProps[key] = null;
        else if (Array.isArray(val)) irProps[key] = val as IRValue[];
        else irProps[key] = JSON.stringify(val);
      }
      spec.updateProps(id, irProps);
    },
    reorderElement: (parentId: string, oldIndex: number, newIndex: number) => {
      // Legacy: find the child at oldIndex in the parent
      if (!spec.irDocument) return;
      const parent = findNodeById(spec.irDocument.root, parentId);
      if (!parent || !parent.children[oldIndex]) return;
      const nodeId = parent.children[oldIndex].id;
      spec.moveComponent(nodeId, parentId, newIndex);
    },
    importCatalog: (catalog: CatalogDefinition) => spec.importCatalog(catalog),
    getSelectedElement: spec.getSelectedElement,

    // ─── Time Travel ────────────────────────────────────────────────────
    undo: spec.undo,
    redo: spec.redo,
    canUndo: spec.canUndo,
    canRedo: spec.canRedo,
    events: spec.events,
    eventIndex: spec.eventIndex,

    // ─── UI State ───────────────────────────────────────────────────────
    historyOpen: ui.historyOpen,
    shortcutsOpen: ui.shortcutsOpen,
    apiKeyModalOpen: ui.apiKeyModalOpen,
    importCatalogOpen: ui.importCatalogOpen,
    exportModalOpen: ui.exportModalOpen,
    shareModalOpen: ui.shareModalOpen,
    settingsOpen: ui.settingsOpen,
    timelineOpen: ui.timelineOpen,
    panelSizes: ui.panelSizes,
    theme: ui.theme,
    inspectorTab: ui.inspectorTab,
    editorTab: ui.editorTab,

    setHistoryOpen: ui.setHistoryOpen,
    setShortcutsOpen: ui.setShortcutsOpen,
    setApiKeyModalOpen: ui.setApiKeyModalOpen,
    setImportCatalogOpen: ui.setImportCatalogOpen,
    setExportModalOpen: ui.setExportModalOpen,
    setShareModalOpen: ui.setShareModalOpen,
    setSettingsOpen: ui.setSettingsOpen,
    setTimelineOpen: ui.setTimelineOpen,
    setPanelSizes: ui.setPanelSizes,
    setTheme: ui.setTheme,
    setInspectorTab: ui.setInspectorTab,
    setEditorTab: ui.setEditorTab,

    // ─── LLM State ──────────────────────────────────────────────────────
    isGenerating: llm.isGenerating,
    generationError: llm.generationError,
    activePersonaId: llm.activePersonaId,

    setIsGenerating: llm.setIsGenerating,
    setGenerationError: llm.setGenerationError,
    setActivePersona: llm.setActivePersona,
    getActivePersona: llm.getActivePersona,

    // ─── Registry ───────────────────────────────────────────────────────
    registryEntries: registry.entries,
    registrySearchQuery: registry.searchQuery,
    getFilteredEntries: registry.getFilteredEntries,
    setRegistrySearchQuery: registry.setSearchQuery,
  };
}
