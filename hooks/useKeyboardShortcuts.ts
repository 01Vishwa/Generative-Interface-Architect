"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { saveSnapshot } from "@/lib/history";

/**
 * Global keyboard shortcut handler.
 * Binds shortcuts to editor actions.
 */
export function useKeyboardShortcuts() {
  const {
    selectedElementId,
    selectElement,
    deleteElement,
    rawText,
    parsedSpec,
    format,
    setShortcutsOpen,
    setHistoryOpen,
  } = useEditorStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;

      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.getAttribute("role") === "textbox" ||
        target.closest(".monaco-editor");

      // ? - Show keyboard shortcuts (only when not in input)
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Escape - Deselect
      if (e.key === "Escape") {
        selectElement(null);
        setShortcutsOpen(false);
        return;
      }

      // Delete - Remove selected component (only when not in input)
      if (e.key === "Delete" && selectedElementId && !isInput) {
        e.preventDefault();
        if (confirm("Remove this component?")) {
          deleteElement(selectedElementId);
        }
        return;
      }

      // Ctrl+S - Star/save snapshot
      if (isCmd && e.key === "s") {
        e.preventDefault();
        if (parsedSpec) {
          saveSnapshot(rawText, format, parsedSpec);
        }
        return;
      }

      // Ctrl+E - Toggle export (handled by ExportMenu via its own button)
      // We just prevent default to avoid browser behavior
      if (isCmd && e.key === "e") {
        e.preventDefault();
        return;
      }

      // Ctrl+/ - Toggle history
      if (isCmd && e.key === "/") {
        e.preventDefault();
        setHistoryOpen(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementId,
    selectElement,
    deleteElement,
    rawText,
    parsedSpec,
    format,
    setShortcutsOpen,
    setHistoryOpen,
  ]);
}
