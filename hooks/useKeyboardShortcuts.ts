"use client";

import { useEffect } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { useToastStore } from "@/lib/store/useToastStore";

/**
 * Global keyboard shortcut handler.
 * Binds shortcuts to editor actions.
 */
export function useKeyboardShortcuts() {
  const undo = useSpecStore((s) => s.undo);
  const redo = useSpecStore((s) => s.redo);
  const irDocument = useSpecStore((s) => s.irDocument);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const deleteComponent = useSpecStore((s) => s.deleteComponent);
  const selectNode = useSpecStore((s) => s.selectNode);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const setHistoryOpen = useUIStore((s) => s.setHistoryOpen);

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
        selectNode(null);
        setShortcutsOpen(false);
        return;
      }

      // Delete - Remove selected component
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        if (!selectedNodeId || !irDocument) return;

        // Find the node name for a better toast message
        let nodeName = "Component";
        const findNode = (node: any): any => {
          if (node.id === selectedNodeId) return node;
          for (const child of node.children || []) {
            const found = findNode(child);
            if (found) return found;
          }
          return null;
        };
        const node = findNode(irDocument.root);
        if (node) nodeName = node.type;

        deleteComponent(selectedNodeId);
        useToastStore.getState().addToast({
          type: "undo",
          message: `${nodeName} deleted · Undo`,
          duration: 5000,
          actionLink: {
            label: "Undo",
            onClick: undo,
          },
        });
        return;
      }

      // Ctrl+S - Star/save snapshot (TODO: wire to new store logic if needed)
      if (isCmd && e.key === "s") {
        e.preventDefault();
        // saveSnapshot logic goes here
        return;
      }

      // Ctrl+Z - Undo
      if (isCmd && e.key === "z" && !e.shiftKey && !isInput) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z - Redo
      if (isCmd && e.key === "z" && e.shiftKey && !isInput) {
        e.preventDefault();
        redo();
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
    undo,
    redo,
    irDocument,
    selectedNodeId,
    deleteComponent,
    selectNode,
    setShortcutsOpen,
    setHistoryOpen,
  ]);
}
