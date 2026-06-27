import { HistorySnapshot, FormatType } from "./types";
import { countElements } from "./specMutations";

const STORAGE_KEY = "genui_playground_history";
const MAX_SNAPSHOTS = 50;

export function loadSnapshots(): HistorySnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(
  text: string,
  format: FormatType,
  parsed: unknown
): HistorySnapshot[] {
  const snapshots = loadSnapshots();

  const snapshot: HistorySnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    text,
    format,
    componentCount: countElements(parsed, format),
    byteSize: new Blob([text]).size,
    starred: false,
  };

  // Add to front
  snapshots.unshift(snapshot);

  // Keep only MAX_SNAPSHOTS, but always keep starred ones
  const starred = snapshots.filter((s) => s.starred);
  const unstarred = snapshots.filter((s) => !s.starred);
  const trimmed = [...starred, ...unstarred.slice(0, MAX_SNAPSHOTS - starred.length)];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function starSnapshot(id: string, starred: boolean): HistorySnapshot[] {
  const snapshots = loadSnapshots();
  const idx = snapshots.findIndex((s) => s.id === id);
  if (idx !== -1) {
    snapshots[idx] = { ...snapshots[idx], starred };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }
  return snapshots;
}

export function deleteSnapshot(id: string): HistorySnapshot[] {
  const snapshots = loadSnapshots().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  return snapshots;
}

export function clearHistory(): HistorySnapshot[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

// ─── Relative Time Formatting ────────────────────────────────────────────────

export function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

const API_KEY_STORAGE = "genui_playground_api_key";
const SPLIT_RATIO_STORAGE = "genui_playground_split_ratio";
const LAST_FORMAT_STORAGE = "genui_playground_last_format";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

export function getSplitRatio(): number {
  if (typeof window === "undefined") return 50;
  const raw = localStorage.getItem(SPLIT_RATIO_STORAGE);
  return raw ? parseFloat(raw) : 50;
}

export function setSplitRatio(ratio: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPLIT_RATIO_STORAGE, ratio.toString());
}

export function getLastFormat(): FormatType | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_FORMAT_STORAGE) as FormatType | null;
}

export function setLastFormat(format: FormatType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_FORMAT_STORAGE, format);
}
