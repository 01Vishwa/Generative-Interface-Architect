import { StateCreator } from "zustand";
import { StoreState } from "./index";

export interface UISlice {
  historyOpen: boolean;
  shortcutsOpen: boolean;
  apiKeyModalOpen: boolean;
  importCatalogOpen: boolean;
  exportModalOpen: boolean;
  shareModalOpen: boolean;

  setHistoryOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setApiKeyModalOpen: (v: boolean) => void;
  setImportCatalogOpen: (v: boolean) => void;
  setExportModalOpen: (v: boolean) => void;
  setShareModalOpen: (v: boolean) => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  historyOpen: false,
  shortcutsOpen: false,
  apiKeyModalOpen: false,
  importCatalogOpen: false,
  exportModalOpen: false,
  shareModalOpen: false,

  setHistoryOpen: (v) => set({ historyOpen: v }),
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  setApiKeyModalOpen: (v) => set({ apiKeyModalOpen: v }),
  setImportCatalogOpen: (v) => set({ importCatalogOpen: v }),
  setExportModalOpen: (v) => set({ exportModalOpen: v }),
  setShareModalOpen: (v) => set({ shareModalOpen: v }),
});
