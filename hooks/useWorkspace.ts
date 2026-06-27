// ─── useWorkspace — Load/Save/Auto-save ──────────────────────────────────────
// Manages workspace lifecycle with IndexedDB persistence and auto-save.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import {
  saveWorkspace,
  loadWorkspace,
  type StoredWorkspace,
} from "@/lib/persistence/indexeddb";
import { v4 as uuidv4 } from "uuid";
import type { FormatType } from "@/lib/types";

export interface UseWorkspaceOptions {
  workspaceId?: string;
  autoSaveInterval?: number; // ms, 0 = disabled
}

export function useWorkspace(options: UseWorkspaceOptions = {}) {
  const { workspaceId, autoSaveInterval = 2000 } = options;
  const rawText = useSpecStore((s) => s.rawText);
  const format = useSpecStore((s) => s.format);
  const initFromText = useSpecStore((s) => s.initFromText);

  const [currentId, setCurrentId] = useState(workspaceId || uuidv4());
  const [lastSavedText, setLastSavedText] = useState("");

  // ─── Load workspace ────────────────────────────────────────────────────
  const load = useCallback(async (id: string) => {
    const workspace = await loadWorkspace(id);
    if (workspace) {
      setCurrentId(workspace.id);
      initFromText(workspace.rawText, workspace.format as FormatType);
      setLastSavedText(workspace.rawText);
      return workspace;
    }
    return null;
  }, [initFromText]);

  // ─── Save workspace ────────────────────────────────────────────────────
  const save = useCallback(async (name?: string) => {
    const workspace: StoredWorkspace = {
      id: currentId,
      name: name || `Workspace ${currentId.slice(0, 6)}`,
      rawText,
      format,
      createdAt: Date.now(), // Will be set on first save
      updatedAt: Date.now(),
      isShared: false,
      settings: JSON.stringify({
        persona: "genui-architect",
        panelSizes: [30, 40, 30],
        autoSaveInterval,
      }),
    };

    await saveWorkspace(workspace);
    setLastSavedText(rawText);
    return workspace;
  }, [currentId, rawText, format, autoSaveInterval]);

  // ─── Auto-save ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoSaveInterval <= 0) return;

    const timer = setInterval(async () => {
      if (rawText !== lastSavedText && rawText.trim()) {
        await save();
      }
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [rawText, lastSavedText, autoSaveInterval, save]);

  // ─── Load on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (workspaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load(workspaceId);
    }
  }, [workspaceId, load]);

  return {
    workspaceId: currentId,
    save,
    load,
    isDirty: rawText !== lastSavedText,
  };
}
