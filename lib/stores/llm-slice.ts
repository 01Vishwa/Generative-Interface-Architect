import { StateCreator } from "zustand";
import { StoreState } from "./index";

export interface LLMSlice {
  isGenerating: boolean;
  generationError: string | null;

  setIsGenerating: (v: boolean) => void;
  setGenerationError: (err: string | null) => void;
}

export const createLLMSlice: StateCreator<StoreState, [], [], LLMSlice> = (set) => ({
  isGenerating: false,
  generationError: null,

  setIsGenerating: (v) => set({ isGenerating: v }),
  setGenerationError: (err) => set({ generationError: err }),
});
