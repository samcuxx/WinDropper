import { create } from "zustand";

type ThemeType = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
}));
