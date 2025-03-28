import { contextBridge, ipcRenderer } from "electron";

// Define the exposed API
contextBridge.exposeInMainWorld("electron", {
  // Settings operations
  getSettings: () =>
    ipcRenderer.invoke("get-settings").catch((err) => {
      console.error("Error getting settings:", err);
      return {}; // Return empty object as fallback
    }),
  updateSettings: (settings: any) =>
    ipcRenderer.invoke("update-settings", settings).catch((err) => {
      console.error("Error updating settings:", err);
      return {};
    }),
  toggleAlwaysOnTop: () =>
    ipcRenderer.invoke("toggle-always-on-top").catch((err) => {
      console.error("Error toggling always on top:", err);
      return false;
    }),

  // Window operations
  startDrag: () => ipcRenderer.send("window-drag-start"),
  startNativeDrag: (filePaths: string[]) =>
    ipcRenderer.invoke("start-native-drag", filePaths).catch((err) => {
      console.error("Error starting native drag:", err);
      return false;
    }),
  refreshNotchWindow: () =>
    ipcRenderer.invoke("refresh-notch-window").catch((err) => {
      console.error("Error refreshing notch window:", err);
      return false;
    }),

  // File operations
  dropFiles: (filePaths: string[]) =>
    ipcRenderer.invoke("drop-files", filePaths).catch((err) => {
      console.error("Error dropping files:", err);
      return [];
    }),
  clearStack: () =>
    ipcRenderer.invoke("clear-stack").catch((err) => {
      console.error("Error clearing stack:", err);
      return [];
    }),
  moveFilesToDestination: (destinationPath: string) =>
    ipcRenderer
      .invoke("move-files-to-destination", destinationPath)
      .catch((err) => {
        console.error("Error moving files:", err);
        return { successes: 0, failures: 0 };
      }),
  copyFilePaths: (selectedPaths?: string[]) =>
    ipcRenderer.invoke("copy-file-paths", selectedPaths).catch((err) => {
      console.error("Error copying file paths:", err);
      return false;
    }),
  openContainingFolder: (filePath: string) =>
    ipcRenderer.invoke("open-containing-folder", filePath).catch((err) => {
      console.error("Error opening containing folder:", err);
      return false;
    }),
  removeFileFromStack: (filePath: string) =>
    ipcRenderer.invoke("remove-file-from-stack", filePath).catch((err) => {
      console.error("Error removing file from stack:", err);
      return [];
    }),
  selectDestinationFolder: () =>
    ipcRenderer.invoke("select-destination-folder").catch((err) => {
      console.error("Error selecting destination folder:", err);
      return null;
    }),

  // Event subscriptions
  onFilesUpdated: (callback: (files: any[]) => void) => {
    const subscription = (_: any, files: any[]) => {
      try {
        callback(files || []);
      } catch (error) {
        console.error("Error in files updated callback:", error);
      }
    };
    ipcRenderer.on("files-updated", subscription);
    return () => {
      ipcRenderer.removeListener("files-updated", subscription);
    };
  },

  onNotification: (
    callback: (message: { title: string; body: string }) => void
  ) => {
    const subscription = (_: any, message: { title: string; body: string }) => {
      try {
        callback(message || { title: "", body: "" });
      } catch (error) {
        console.error("Error in notification callback:", error);
      }
    };
    ipcRenderer.on("notification", subscription);
    return () => {
      ipcRenderer.removeListener("notification", subscription);
    };
  },
});
