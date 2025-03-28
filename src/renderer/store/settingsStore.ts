import { create } from "zustand";

interface NotchSettings {
  width: number;
  height: number;
  x: number;
  y: number;
  alwaysOnTop: boolean;
  theme: "light" | "dark" | "system";
  opacity: number;
  autoHide: boolean;
}

interface FileSettings {
  defaultDestination: string;
  autoClearTimeout: number | null; // in minutes, null means never
  categorizeByType: boolean;
  recentDestinations: string[];
}

interface Settings {
  notch: NotchSettings;
  files: FileSettings;
}

// Default settings - will be used as fallback
const defaultSettings: Settings = {
  notch: {
    width: 300,
    height: 200,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    theme: "system",
    opacity: 0.9,
    autoHide: false,
  },
  files: {
    defaultDestination: "",
    autoClearTimeout: null,
    categorizeByType: true,
    recentDestinations: [],
  },
};

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: Settings) => void;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings, // Initialize with default settings
  isLoading: false,
  error: null,

  setSettings: (settings) => set({ settings: settings || defaultSettings }),

  updateSettings: async (newSettings) => {
    try {
      set({ isLoading: true, error: null });
      const currentSettings = get().settings || defaultSettings;

      // Merge new settings with current settings
      const mergedSettings = {
        ...currentSettings,
        ...(newSettings.notch && {
          notch: { ...currentSettings.notch, ...newSettings.notch },
        }),
        ...(newSettings.files && {
          files: { ...currentSettings.files, ...newSettings.files },
        }),
      };

      try {
        // Save to electron store
        const updatedSettings = await window.electron.updateSettings(
          mergedSettings
        );
        set({ settings: updatedSettings || defaultSettings, isLoading: false });
      } catch (error) {
        console.error("Failed to update settings in Electron store:", error);
        // If electron store update fails, at least update the local state
        set({ settings: mergedSettings, isLoading: false });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      set({ error: "Failed to update settings", isLoading: false });
    }
  },

  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      try {
        const settings = await window.electron.getSettings();
        set({
          settings: settings || defaultSettings,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading settings from Electron:", error);
        // If we can't load from electron, at least use the defaults
        set({
          settings: defaultSettings,
          isLoading: false,
          error: "Failed to load settings from app, using defaults",
        });
      }
    } catch (error) {
      console.error("Error in loadSettings:", error);
      set({
        error: "Failed to load settings",
        isLoading: false,
        settings: defaultSettings, // Still set defaults even on error
      });
    }
  },
}));
