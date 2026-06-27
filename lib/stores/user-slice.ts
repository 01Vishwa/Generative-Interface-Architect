import { StateCreator } from "zustand";
import { StoreState } from "./index";

export interface UserSlice {
  // We can add user preferences here, like theme, etc.
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const createUserSlice: StateCreator<StoreState, [], [], UserSlice> = (set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
});
