// ─── Registry Store — Components, Tokens, Versions ──────────────────────────
// Manages the component registry, design tokens, and version pinning.

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CatalogDefinition } from "@/lib/types";
import type { DesignToken, DesignTokenCollection, ComponentDefinition } from "@/types/catalog";
import { DEFAULT_CATALOG } from "@/lib/catalog";

// ─── Store Types ─────────────────────────────────────────────────────────────

export interface RegistryEntry {
  name: string;
  definition: ComponentDefinition;
  version: string;
  tags: string[];
  author: string;
  source: "builtin" | "custom" | "npm";
  installedAt: number;
  pinned: boolean;
}

export interface RegistryState {
  // ─── Registry Data ──────────────────────────────────────────────────────
  /** All registered components */
  entries: RegistryEntry[];
  /** Search query */
  searchQuery: string;
  /** Active filter tags */
  activeTags: string[];
  /** View mode */
  viewMode: "grid" | "list";
  /** Favorites */
  favorites: Set<string>;

  // ─── Design Tokens ──────────────────────────────────────────────────────
  tokens: DesignTokenCollection;

  // ─── Actions ────────────────────────────────────────────────────────────
  /** Get a unified catalog from registry entries */
  getCatalog: () => CatalogDefinition;
  /** Register a new component */
  registerComponent: (name: string, definition: ComponentDefinition, source?: "custom" | "npm") => void;
  /** Unregister a component */
  unregisterComponent: (name: string) => void;
  /** Pin a component version */
  pinVersion: (name: string, version: string) => void;
  /** Unpin a component version */
  unpinVersion: (name: string) => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Toggle a filter tag */
  toggleTag: (tag: string) => void;
  /** Set view mode */
  setViewMode: (mode: "grid" | "list") => void;
  /** Toggle favorite */
  toggleFavorite: (name: string) => void;
  /** Import a full catalog */
  importCatalog: (catalog: CatalogDefinition) => void;
  /** Get filtered entries */
  getFilteredEntries: () => RegistryEntry[];
  /** Get all unique tags */
  getAllTags: () => string[];
  /** Add a design token */
  addToken: (token: DesignToken) => void;
  /** Remove a design token */
  removeToken: (name: string) => void;
  /** Update a design token value */
  updateToken: (name: string, value: string) => void;
}

// ─── Build Default Entries ───────────────────────────────────────────────────

function buildDefaultEntries(): RegistryEntry[] {
  return Object.entries(DEFAULT_CATALOG.components).map(([name, def]) => ({
    name,
    definition: {
      ...def,
      version: "1.0.0",
      tags: getDefaultTags(name),
      author: "GenUI",
      icon: getDefaultIcon(name),
    },
    version: "1.0.0",
    tags: getDefaultTags(name),
    author: "GenUI",
    source: "builtin" as const,
    installedAt: Date.now(),
    pinned: false,
  }));
}

function getDefaultTags(name: string): string[] {
  const tagMap: Record<string, string[]> = {
    Card: ["layout", "container"],
    Metric: ["data", "display"],
    Text: ["typography", "display"],
    Button: ["action", "interactive"],
    Badge: ["status", "display"],
    Divider: ["layout", "separator"],
    Stack: ["layout", "container"],
    Table: ["data", "display"],
    Input: ["form", "interactive"],
    Select: ["form", "interactive"],
    Progress: ["feedback", "display"],
    Alert: ["feedback", "display"],
  };
  return tagMap[name] || ["other"];
}

function getDefaultIcon(name: string): string {
  const iconMap: Record<string, string> = {
    Card: "square",
    Metric: "trending-up",
    Text: "type",
    Button: "mouse-pointer-click",
    Badge: "tag",
    Divider: "minus",
    Stack: "layers",
    Table: "table-2",
    Input: "text-cursor-input",
    Select: "chevrons-up-down",
    Progress: "loader",
    Alert: "alert-triangle",
  };
  return iconMap[name] || "box";
}

// ─── Default Tokens ──────────────────────────────────────────────────────────

const DEFAULT_TOKENS: DesignTokenCollection = {
  tokens: [
    { name: "color.primary.500", category: "color", value: "#3b82f6", cssVariable: "--color-primary-500", label: "Primary", group: "primary" },
    { name: "color.primary.600", category: "color", value: "#2563eb", cssVariable: "--color-primary-600", label: "Primary Dark", group: "primary" },
    { name: "color.success.500", category: "color", value: "#22c55e", cssVariable: "--color-success-500", label: "Success", group: "success" },
    { name: "color.warning.500", category: "color", value: "#f59e0b", cssVariable: "--color-warning-500", label: "Warning", group: "warning" },
    { name: "color.danger.500", category: "color", value: "#ef4444", cssVariable: "--color-danger-500", label: "Danger", group: "danger" },
    { name: "color.neutral.100", category: "color", value: "#f3f4f6", cssVariable: "--color-neutral-100", label: "Neutral Light", group: "neutral" },
    { name: "color.neutral.900", category: "color", value: "#111827", cssVariable: "--color-neutral-900", label: "Neutral Dark", group: "neutral" },
    { name: "spacing.xs", category: "spacing", value: "4px", cssVariable: "--spacing-xs", label: "Extra Small" },
    { name: "spacing.sm", category: "spacing", value: "8px", cssVariable: "--spacing-sm", label: "Small" },
    { name: "spacing.md", category: "spacing", value: "16px", cssVariable: "--spacing-md", label: "Medium" },
    { name: "spacing.lg", category: "spacing", value: "24px", cssVariable: "--spacing-lg", label: "Large" },
    { name: "spacing.xl", category: "spacing", value: "32px", cssVariable: "--spacing-xl", label: "Extra Large" },
    { name: "radius.sm", category: "radius", value: "4px", cssVariable: "--radius-sm", label: "Small" },
    { name: "radius.md", category: "radius", value: "8px", cssVariable: "--radius-md", label: "Medium" },
    { name: "radius.lg", category: "radius", value: "12px", cssVariable: "--radius-lg", label: "Large" },
    { name: "radius.full", category: "radius", value: "9999px", cssVariable: "--radius-full", label: "Full" },
  ],
  metadata: { name: "GenUI Default", version: "1.0.0" },
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useRegistryStore = create<RegistryState>()(
  devtools(
    persist(
      (set, get) => ({
        entries: buildDefaultEntries(),
        searchQuery: "",
        activeTags: [],
        viewMode: "list",
        favorites: new Set<string>(),
        tokens: DEFAULT_TOKENS,

        getCatalog: () => {
          const { entries } = get();
          const components: Record<string, ComponentDefinition> = {};
          for (const entry of entries) {
            components[entry.name] = entry.definition;
          }
          return { components };
        },

        registerComponent: (name, definition, source = "custom") => {
          set((state) => ({
            entries: [
              ...state.entries.filter((e) => e.name !== name),
              {
                name,
                definition,
                version: definition.version || "1.0.0",
                tags: definition.tags || [],
                author: definition.author || "Custom",
                source,
                installedAt: Date.now(),
                pinned: false,
              },
            ],
          }));
        },

        unregisterComponent: (name) => {
          set((state) => ({
            entries: state.entries.filter((e) => e.name !== name),
          }));
        },

        pinVersion: (name, version) => {
          set((state) => ({
            entries: state.entries.map((e) =>
              e.name === name ? { ...e, version, pinned: true } : e
            ),
          }));
        },

        unpinVersion: (name) => {
          set((state) => ({
            entries: state.entries.map((e) =>
              e.name === name ? { ...e, pinned: false } : e
            ),
          }));
        },

        setSearchQuery: (query) => set({ searchQuery: query }),

        toggleTag: (tag) =>
          set((state) => ({
            activeTags: state.activeTags.includes(tag)
              ? state.activeTags.filter((t) => t !== tag)
              : [...state.activeTags, tag],
          })),

        setViewMode: (mode) => set({ viewMode: mode }),

        toggleFavorite: (name) =>
          set((state) => {
            const next = new Set(state.favorites);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return { favorites: next };
          }),

        importCatalog: (catalog) => {
          const entries: RegistryEntry[] = Object.entries(catalog.components).map(
            ([name, def]) => ({
              name,
              definition: { ...def, version: "1.0.0", tags: [], author: "Imported" },
              version: "1.0.0",
              tags: [],
              author: "Imported",
              source: "custom" as const,
              installedAt: Date.now(),
              pinned: false,
            })
          );
          set((state) => ({
            entries: [
              ...state.entries.filter((e) => e.source === "builtin"),
              ...entries,
            ],
          }));
        },

        getFilteredEntries: () => {
          const { entries, searchQuery, activeTags } = get();
          let filtered = entries;

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (e) =>
                e.name.toLowerCase().includes(q) ||
                e.definition.description.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q))
            );
          }

          if (activeTags.length > 0) {
            filtered = filtered.filter((e) =>
              activeTags.some((tag) => e.tags.includes(tag))
            );
          }

          return filtered;
        },

        getAllTags: () => {
          const { entries } = get();
          const tags = new Set<string>();
          for (const entry of entries) {
            entry.tags.forEach((t) => tags.add(t));
          }
          return Array.from(tags).sort();
        },

        addToken: (token) =>
          set((state) => ({
            tokens: {
              ...state.tokens,
              tokens: [...state.tokens.tokens, token],
            },
          })),

        removeToken: (name) =>
          set((state) => ({
            tokens: {
              ...state.tokens,
              tokens: state.tokens.tokens.filter((t) => t.name !== name),
            },
          })),

        updateToken: (name, value) =>
          set((state) => ({
            tokens: {
              ...state.tokens,
              tokens: state.tokens.tokens.map((t) =>
                t.name === name ? { ...t, value } : t
              ),
            },
          })),
      }),
      {
        name: "genui-registry-store",
        partializer: (state) => ({
          entries: state.entries.filter((e) => e.source !== "builtin"),
          favorites: Array.from(state.favorites),
          viewMode: state.viewMode,
          tokens: state.tokens,
        }),
        merge: (persisted: unknown, current) => {
          return {
            ...current,
            ...(persisted as RegistryState),
            entries: [...buildDefaultEntries(), ...((persisted as RegistryState)?.entries || [])],
            favorites: new Set((persisted as RegistryState)?.favorites || []),
          };
        },
      }
    ),
    { name: "RegistryStore" }
  )
);
