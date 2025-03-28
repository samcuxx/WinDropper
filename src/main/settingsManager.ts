import Store from "electron-store";
import { app } from "electron";
import * as path from "path";

// Define the settings schema
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
  firstRun: boolean;
  startOnBoot: boolean;
}

// Default settings
const defaultSettings: Settings = {
  notch: {
    width: 300,
    height: 200,
    x: 0, // Will be set dynamically
    y: 0, // Will be set dynamically
    alwaysOnTop: true,
    theme: "system",
    opacity: 0.9,
    autoHide: false,
  },
  files: {
    defaultDestination: path.join(app.getPath("documents"), "WinDropper"),
    autoClearTimeout: null,
    categorizeByType: true,
    recentDestinations: [],
  },
  firstRun: true,
  startOnBoot: true, // Default to start on boot
};

export function createSettingsManager() {
  // Initialize store with schema
  const store = new Store<Settings>({
    defaults: defaultSettings,
    name: "winDropper-settings",
  });

  // If it's the first run, create the default destination directory
  if (store.get("firstRun")) {
    try {
      const fs = require("fs");
      const defaultDestination = store.get("files.defaultDestination");
      if (!fs.existsSync(defaultDestination)) {
        fs.mkdirSync(defaultDestination, { recursive: true });
      }
      store.set("firstRun", false);
    } catch (error) {
      console.error("Error creating default destination directory:", error);
    }
  }

  return {
    // Get all settings
    getAllSettings(): Settings {
      return store.store;
    },

    // Get notch settings
    getNotchSettings(): NotchSettings {
      return store.get("notch");
    },

    // Get file settings
    getFileSettings(): FileSettings {
      return store.get("files");
    },

    // Update settings
    updateSettings(settings: Partial<Settings>): void {
      // Deep merge the settings
      if (settings.notch) {
        store.set("notch", { ...store.get("notch"), ...settings.notch });
      }
      if (settings.files) {
        store.set("files", { ...store.get("files"), ...settings.files });
      }
    },

    // Set notch position
    setNotchPosition(x: number, y: number): void {
      store.set("notch.x", x);
      store.set("notch.y", y);
    },

    // Set notch size
    setNotchSize(width: number, height: number): void {
      store.set("notch.width", width);
      store.set("notch.height", height);
    },

    // Set notch always on top
    setNotchAlwaysOnTop(alwaysOnTop: boolean): void {
      store.set("notch.alwaysOnTop", alwaysOnTop);
    },

    // Add a recent destination
    addRecentDestination(destination: string): void {
      try {
        if (!destination) return;

        // Get current destinations with a fallback to empty array if undefined
        const recentDestinations = store.get(
          "files.recentDestinations",
          []
        ) as string[];

        // Remove if already exists
        const filtered = recentDestinations.filter(
          (d: string) => d !== destination
        );

        // Add to the beginning
        filtered.unshift(destination);

        // Keep only the last 10
        store.set("files.recentDestinations", filtered.slice(0, 10));
      } catch (error) {
        console.error("Error adding recent destination:", error);
      }
    },

    // Clear recent destinations
    clearRecentDestinations(): void {
      store.set("files.recentDestinations", []);
    },

    // Get start on boot setting
    getStartOnBoot(): boolean {
      return store.get("startOnBoot", true);
    },

    // Set start on boot setting
    setStartOnBoot(enabled: boolean): void {
      store.set("startOnBoot", enabled);
    },

    // Reset settings to default
    resetSettings(): void {
      store.clear();
      store.store = defaultSettings;
    },
  };
}
