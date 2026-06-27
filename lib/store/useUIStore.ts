// ─── UI Store — Selection, Viewport, Panels ─────────────────────────────────
// Manages all UI state: modals, panel sizes, active tabs, theme, etc.

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type PanelTab = "editor" | "preview" | "console";
export type InspectorTab = "properties" | "registry" | "tokens";
export type ThemeMode = "light" | "dark" | "system";

export interface UIState {
  // ─── Panel Layout ──────────────────────────────────────────────────────
  /** Three pane sizes as percentages [editor, canvas, inspector] */
  panelSizes: [number, number, number];
  /** Whether each panel is collapsed */
  panelCollapsed: [boolean, boolean, boolean];
  /** Active tab in the editor pane */
  editorTab: PanelTab;
  /** Active tab in the inspector pane */
  inspectorTab: InspectorTab;
  /** Whether the timeline is visible */
  timelineOpen: boolean;
  /** Timeline height in pixels */
  timelineHeight: number;

  // ─── Modals ────────────────────────────────────────────────────────────
  historyOpen: boolean;
  shortcutsOpen: boolean;
  apiKeyModalOpen: boolean;
  importCatalogOpen: boolean;
  exportModalOpen: boolean;
  shareModalOpen: boolean;
  settingsOpen: boolean;
  personaSelectorOpen: boolean;

  // ─── Viewport ──────────────────────────────────────────────────────────
  /** Canvas zoom level (1 = 100%) */
  canvasZoom: number;
  /** Canvas scroll position */
  canvasScroll: { x: number; y: number };
  /** Preview device frame */
  previewDevice: "desktop" | "tablet" | "mobile";

  // ─── Theme ─────────────────────────────────────────────────────────────
  theme: ThemeMode;

  // ─── Actions ───────────────────────────────────────────────────────────
  setPanelSizes: (sizes: [number, number, number]) => void;
  togglePanel: (index: 0 | 1 | 2) => void;
  setEditorTab: (tab: PanelTab) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setTimelineOpen: (open: boolean) => void;
  setTimelineHeight: (height: number) => void;

  setHistoryOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setApiKeyModalOpen: (v: boolean) => void;
  setImportCatalogOpen: (v: boolean) => void;
  setExportModalOpen: (v: boolean) => void;
  setShareModalOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setPersonaSelectorOpen: (v: boolean) => void;

  setCanvasZoom: (zoom: number) => void;
  setCanvasScroll: (scroll: { x: number; y: number }) => void;
  setPreviewDevice: (device: "desktop" | "tablet" | "mobile") => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // ─── Initial State ─────────────────────────────────────────────────
        panelSizes: [30, 40, 30],
        panelCollapsed: [false, false, false],
        editorTab: "editor",
        inspectorTab: "properties",
        timelineOpen: false,
        timelineHeight: 200,

        historyOpen: false,
        shortcutsOpen: false,
        apiKeyModalOpen: false,
        importCatalogOpen: false,
        exportModalOpen: false,
        shareModalOpen: false,
        settingsOpen: false,
        personaSelectorOpen: false,

        canvasZoom: 1,
        canvasScroll: { x: 0, y: 0 },
        previewDevice: "desktop",
        theme: "dark",

        // ─── Actions ───────────────────────────────────────────────────────
        setPanelSizes: (sizes) => set({ panelSizes: sizes }),
        togglePanel: (index) =>
          set((state) => {
            const collapsed = [...state.panelCollapsed] as [boolean, boolean, boolean];
            collapsed[index] = !collapsed[index];
            return { panelCollapsed: collapsed };
          }),
        setEditorTab: (tab) => set({ editorTab: tab }),
        setInspectorTab: (tab) => set({ inspectorTab: tab }),
        setTimelineOpen: (open) => set({ timelineOpen: open }),
        setTimelineHeight: (height) => set({ timelineHeight: height }),

        setHistoryOpen: (v) => set({ historyOpen: v }),
        setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
        setApiKeyModalOpen: (v) => set({ apiKeyModalOpen: v }),
        setImportCatalogOpen: (v) => set({ importCatalogOpen: v }),
        setExportModalOpen: (v) => set({ exportModalOpen: v }),
        setShareModalOpen: (v) => set({ shareModalOpen: v }),
        setSettingsOpen: (v) => set({ settingsOpen: v }),
        setPersonaSelectorOpen: (v) => set({ personaSelectorOpen: v }),

        setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
        setCanvasScroll: (scroll) => set({ canvasScroll: scroll }),
        setPreviewDevice: (device) => set({ previewDevice: device }),
        setTheme: (theme) => set({ theme }),
      }),
      { name: "genui-ui-store", partializer: (state) => ({
        panelSizes: state.panelSizes,
        theme: state.theme,
        previewDevice: state.previewDevice,
        timelineHeight: state.timelineHeight,
      }) }
    ),
    { name: "UIStore" }
  )
);
