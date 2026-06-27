// ─── IndexedDB Persistence Layer (Dexie) ─────────────────────────────────────
// Local-first storage for workspaces, history events, and registry data.
// Falls back gracefully if IndexedDB is unavailable.

import Dexie, { type Table } from "dexie";
// ─── Database Schema ─────────────────────────────────────────────────────────

export interface StoredWorkspace {
  id: string;
  name: string;
  rawText: string;
  format: "json-render" | "a2ui";
  createdAt: number;
  updatedAt: number;
  isShared: boolean;
  shareId?: string;
  settings: string; // JSON-serialized WorkspaceSettings
}

export interface StoredEvent {
  id: string;
  workspaceId: string;
  type: string;
  timestamp: number;
  description: string;
  payload: string; // JSON-serialized MutationPayload
  branchId: string;
}

export interface StoredSnapshot {
  id: string;
  workspaceId: string;
  text: string;
  format: string;
  timestamp: number;
  componentCount: number;
  byteSize: number;
  starred: boolean;
}

export interface StoredApiKey {
  provider: string;
  key: string;
  updatedAt: number;
}

// ─── Dexie Database ──────────────────────────────────────────────────────────

class GenUIDatabase extends Dexie {
  workspaces!: Table<StoredWorkspace>;
  events!: Table<StoredEvent>;
  snapshots!: Table<StoredSnapshot>;
  apiKeys!: Table<StoredApiKey>;

  constructor() {
    super("GenUIStudio");

    this.version(1).stores({
      workspaces: "id, name, updatedAt, isShared",
      events: "id, workspaceId, timestamp, branchId",
      snapshots: "id, workspaceId, timestamp, starred",
      apiKeys: "provider",
    });
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

let db: GenUIDatabase | null = null;

function getDb(): GenUIDatabase {
  if (!db) {
    db = new GenUIDatabase();
  }
  return db;
}

// ─── Workspace Operations ────────────────────────────────────────────────────

export async function saveWorkspace(workspace: StoredWorkspace): Promise<void> {
  try {
    await getDb().workspaces.put(workspace);
  } catch (e) {
    console.error("Failed to save workspace:", e);
    // Fallback to localStorage
    saveToLocalStorage(`workspace:${workspace.id}`, workspace);
  }
}

export async function loadWorkspace(id: string): Promise<StoredWorkspace | null> {
  try {
    return (await getDb().workspaces.get(id)) || null;
  } catch {
    return loadFromLocalStorage(`workspace:${id}`);
  }
}

export async function listWorkspaces(): Promise<StoredWorkspace[]> {
  try {
    return await getDb().workspaces.orderBy("updatedAt").reverse().toArray();
  } catch {
    return [];
  }
}

export async function deleteWorkspace(id: string): Promise<void> {
  try {
    await getDb().workspaces.delete(id);
    await getDb().events.where("workspaceId").equals(id).delete();
    await getDb().snapshots.where("workspaceId").equals(id).delete();
  } catch (e) {
    console.error("Failed to delete workspace:", e);
  }
}

// ─── Event Operations ────────────────────────────────────────────────────────

export async function saveEvent(event: StoredEvent): Promise<void> {
  try {
    await getDb().events.put(event);
  } catch (e) {
    console.error("Failed to save event:", e);
  }
}

export async function loadEvents(workspaceId: string, branchId?: string): Promise<StoredEvent[]> {
  try {
    const query = getDb().events.where("workspaceId").equals(workspaceId);
    const events = await query.sortBy("timestamp");
    if (branchId) {
      return events.filter((e) => e.branchId === branchId);
    }
    return events;
  } catch {
    return [];
  }
}

// ─── Snapshot Operations ─────────────────────────────────────────────────────

export async function saveSnapshot(snapshot: StoredSnapshot): Promise<void> {
  try {
    await getDb().snapshots.put(snapshot);

    // Keep only last 50 unstarred snapshots per workspace
    const all = await getDb().snapshots
      .where("workspaceId")
      .equals(snapshot.workspaceId)
      .sortBy("timestamp");

    const unstarred = all.filter((s) => !s.starred);
    if (unstarred.length > 50) {
      const toDelete = unstarred.slice(0, unstarred.length - 50);
      await getDb().snapshots.bulkDelete(toDelete.map((s) => s.id));
    }
  } catch (e) {
    console.error("Failed to save snapshot:", e);
  }
}

export async function loadSnapshots(workspaceId: string): Promise<StoredSnapshot[]> {
  try {
    return await getDb().snapshots
      .where("workspaceId")
      .equals(workspaceId)
      .reverse()
      .sortBy("timestamp");
  } catch {
    return [];
  }
}

// ─── API Key Operations ──────────────────────────────────────────────────────

export async function saveApiKey(provider: string, key: string): Promise<void> {
  try {
    await getDb().apiKeys.put({ provider, key, updatedAt: Date.now() });
  } catch {
    saveToLocalStorage(`apikey:${provider}`, key);
  }
}

export async function loadApiKey(provider: string): Promise<string> {
  try {
    const entry = await getDb().apiKeys.get(provider);
    return entry?.key || "";
  } catch {
    return loadFromLocalStorage(`apikey:${provider}`) || "";
  }
}

// ─── LocalStorage Fallback ───────────────────────────────────────────────────

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`genui_${key}`, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`genui_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
