/**
 * Dashboard Store
 * 
 * Client-side persistence layer using localStorage.
 * Stores query + descriptor pairs so users can revisit dashboards.
 * 
 * Design: FIFO eviction at 50 dashboards. UUID-based keys.
 * 
 * @module dashboard-store
 */

import type { DashboardDescriptor } from "./dashboard-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredDashboard {
  id: string;
  query: string;
  descriptor: DashboardDescriptor;
  timestamp: number;
  fileName?: string;
}

export interface DashboardSummary {
  id: string;
  query: string;
  title: string;
  timestamp: number;
  fileName?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "gia_dashboards";
const MAX_DASHBOARDS = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `dash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function readStore(): StoredDashboard[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredDashboard[];
  } catch {
    return [];
  }
}

function writeStore(dashboards: StoredDashboard[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  } catch (e) {
    console.error("Failed to write dashboard store:", e);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Saves a dashboard (query + descriptor) and returns its ID.
 * Evicts the oldest dashboard if at capacity.
 */
export function saveDashboard(
  query: string,
  descriptor: DashboardDescriptor,
  fileName?: string
): string {
  const dashboards = readStore();
  const id = generateId();

  const entry: StoredDashboard = {
    id,
    query,
    descriptor,
    timestamp: Date.now(),
    fileName,
  };

  dashboards.unshift(entry);

  // FIFO eviction
  while (dashboards.length > MAX_DASHBOARDS) {
    dashboards.pop();
  }

  writeStore(dashboards);
  return id;
}

/**
 * Loads a single dashboard by ID.
 * Returns null if not found.
 */
export function loadDashboard(id: string): StoredDashboard | null {
  const dashboards = readStore();
  return dashboards.find((d) => d.id === id) ?? null;
}

/**
 * Returns summaries of all stored dashboards, newest first.
 */
export function listDashboards(): DashboardSummary[] {
  const dashboards = readStore();
  return dashboards.map((d) => ({
    id: d.id,
    query: d.query,
    title: d.descriptor.title,
    timestamp: d.timestamp,
    fileName: d.fileName,
  }));
}

/**
 * Deletes a dashboard by ID.
 * Returns true if found and deleted, false otherwise.
 */
export function deleteDashboard(id: string): boolean {
  const dashboards = readStore();
  const idx = dashboards.findIndex((d) => d.id === id);
  if (idx === -1) return false;

  dashboards.splice(idx, 1);
  writeStore(dashboards);
  return true;
}

/**
 * Clears all stored dashboards.
 */
export function clearAllDashboards(): void {
  writeStore([]);
}
