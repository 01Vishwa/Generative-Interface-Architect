// ─── useUndoRedo — Event Sourcing Keyboard Shortcuts ─────────────────────────
// Wraps the spec store's undo/redo with keyboard bindings and provides
// helper functions for time-travel navigation.

import { useCallback, useEffect } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";

export function useUndoRedo() {
  const undo = useSpecStore((s) => s.undo);
  const redo = useSpecStore((s) => s.redo);
  const canUndo = useSpecStore((s) => s.canUndo);
  const canRedo = useSpecStore((s) => s.canRedo);
  const events = useSpecStore((s) => s.events);
  const eventIndex = useSpecStore((s) => s.eventIndex);
  const jumpToEvent = useSpecStore((s) => s.jumpToEvent);
  const createBranch = useSpecStore((s) => s.createBranch);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }

      if (isCtrlOrCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleJump = useCallback(
    (index: number) => {
      if (index >= -1 && index < events.length) {
        jumpToEvent(index);
      }
    },
    [events.length, jumpToEvent]
  );

  const handleCreateBranch = useCallback(
    (name?: string) => {
      const branchName = name || `Branch ${Date.now().toString(36).slice(-4)}`;
      createBranch(branchName);
    },
    [createBranch]
  );

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    events,
    eventIndex,
    jumpToEvent: handleJump,
    createBranch: handleCreateBranch,
    /** Get events up to the current index (visible events) */
    visibleEvents: events.slice(0, eventIndex + 1),
    /** Get events after the current index (redo stack) */
    redoStack: events.slice(eventIndex + 1),
    /** Total number of events */
    totalEvents: events.length,
  };
}
