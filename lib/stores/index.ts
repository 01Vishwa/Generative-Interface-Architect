import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UISlice, createUISlice } from "./ui-slice";
import { SpecSlice, createSpecSlice } from "./spec-slice";
import { LLMSlice, createLLMSlice } from "./llm-slice";
import { UserSlice, createUserSlice } from "./user-slice";

export type StoreState = UISlice & SpecSlice & LLMSlice & UserSlice;

export const useEditorStore = create<StoreState>()(
  devtools((...a) => ({
    ...createUISlice(...a),
    ...createSpecSlice(...a),
    ...createLLMSlice(...a),
    ...createUserSlice(...a),
  }))
);
