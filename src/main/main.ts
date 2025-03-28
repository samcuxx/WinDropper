import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  screen,
  clipboard,
} from "electron";
import * as path from "path";
import { createSettingsManager } from "./settingsManager";
import { registerFileHandlers } from "./fileHandler";
import * as fs from "fs";

let mainWindow: BrowserWindow | null = null;
let notchWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const settingsManager = createSettingsManager();

// Function to determine if running in development mode
function isDev() {
  return process.env.NODE_ENV === "development";
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    transparent: false,
    backgroundColor: "#ffffff", // White background for light mode
    icon: path.join(__dirname, "../../public/icons/icon.ico"),
    frame: false, // Remove default frame/title bar
    titleBarStyle: "hidden",
  });

  // Load the index.html of the app
  if (isDev()) {
    console.log("Loading main window in development mode");
    // Development mode
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    console.log("Loading main window in production mode");
    // Production mode - load from the built files
    const indexPath = path.join(__dirname, "../renderer/index.html");
    console.log(`Loading from: ${indexPath}`);
    mainWindow.loadFile(indexPath);

    // For debugging in production
    mainWindow.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        console.error(`Failed to load: ${errorDescription} (${errorCode})`);
      }
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  // Prevent the app from closing when the main window is closed
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
    return true;
  });
}

function createNotchWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const notchSettings = settingsManager.getNotchSettings();

  notchWindow = new BrowserWindow({
    width: notchSettings.width || 300,
    height: notchSettings.height || 200,
    x: notchSettings.x || width - 350,
    y: notchSettings.y || height - 250,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000", // Fully transparent
    alwaysOnTop: notchSettings.alwaysOnTop !== false,
    skipTaskbar: true,
    movable: true, // Ensure it's movable
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Set initial opacity from settings
  if (typeof notchSettings.opacity === "number") {
    notchWindow.setOpacity(notchSettings.opacity);
    console.log(
      `Initial notch window opacity set to: ${notchSettings.opacity}`
    );
  }

  // Log window creation
  console.log(
    `Creating notch window at position: ${notchSettings.x || width - 350}, ${
      notchSettings.y || height - 250
    }`
  );

  // Load the notch URL
  if (isDev()) {
    console.log("Loading notch window in development mode");
    // Development mode
    notchWindow.loadURL("http://localhost:3000/#notch");
    // Uncomment to open DevTools for the notch window
    // notchWindow.webContents.openDevTools();
  } else {
    console.log("Loading notch window in production mode");
    // Production mode - load from the built files
    const indexPath = path.join(__dirname, "../renderer/index.html");
    console.log(`Loading from: ${indexPath} with hash: notch`);
    notchWindow.loadFile(indexPath, { hash: "notch" });

    // For debugging in production
    notchWindow.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        console.error(
          `Failed to load notch: ${errorDescription} (${errorCode})`
        );
      }
    );

    // Comment out DevTools for production
    // notchWindow.webContents.openDevTools();
  }

  notchWindow.on("closed", () => {
    notchWindow = null;
  });

  notchWindow.on("ready-to-show", () => {
    notchWindow?.show();
  });

  // Save position when moved
  notchWindow.on("moved", () => {
    const position = notchWindow?.getPosition();
    if (position) {
      settingsManager.setNotchPosition(position[0], position[1]);
    }
  });

  // Save size when resized
  notchWindow.on("resize", () => {
    const size = notchWindow?.getSize();
    if (size) {
      settingsManager.setNotchSize(size[0], size[1]);
    }
  });
}

function createTray() {
  // Determine the correct icon path
  let iconPath;
  if (isDev()) {
    iconPath = path.join(__dirname, "../../public/icons/icon.ico");
  } else {
    // Try multiple potential locations for the icon
    const paths = [
      path.join(__dirname, "../../public/icons/icon.ico"),
      path.join(__dirname, "../renderer/icons/icon.ico"),
    ];

    for (const potentialPath of paths) {
      if (fs.existsSync(potentialPath)) {
        iconPath = potentialPath;
        console.log(`Found icon at: ${iconPath}`);
        break;
      }
    }

    if (!iconPath) {
      console.warn("Icon not found, using default");
      iconPath = path.join(__dirname, "../../public/icons/icon.ico");
    }
  }

  tray = new Tray(iconPath);
  console.log(`Creating tray with icon: ${iconPath}`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show WinDropper",
      click: () => {
        if (!notchWindow) {
          createNotchWindow();
        } else {
          notchWindow.show();
        }
      },
    },
    {
      label: "Settings",
      click: () => {
        if (!mainWindow) {
          createMainWindow();
        } else {
          mainWindow.show();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("WinDropper");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (!notchWindow) {
      createNotchWindow();
    } else {
      notchWindow.show();
    }
  });
}

// Register global shortcut to show/hide the notch
function registerGlobalShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (!notchWindow) {
      createNotchWindow();
    } else {
      if (notchWindow.isVisible()) {
        notchWindow.hide();
      } else {
        notchWindow.show();
      }
    }
  });
}

// Define drag options interface with all possible properties
interface DragOptions {
  file?: string;
  files?: string[];
  icon?: string;
}

// Add type for the startDrag interface
interface WebContentsDrag {
  startDrag: (item: DragOptions) => void;
}

// IPC handlers for settings
function registerIpcHandlers() {
  // Get settings
  ipcMain.handle("get-settings", () => {
    return settingsManager.getAllSettings();
  });

  // Update settings
  ipcMain.handle("update-settings", (_, settings) => {
    settingsManager.updateSettings(settings);
    return settingsManager.getAllSettings();
  });

  // Window control handlers
  ipcMain.handle("minimize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
      return true;
    }
    return false;
  });

  ipcMain.handle("maximize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.restore();
        return false; // Return isMaximized state after action
      } else {
        win.maximize();
        return true; // Return isMaximized state after action
      }
    }
    return false;
  });

  ipcMain.handle("close-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
      return true;
    }
    return false;
  });

  ipcMain.handle("is-window-maximized", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      return win.isMaximized();
    }
    return false;
  });

  // Refresh notch window
  ipcMain.handle("refresh-notch-window", () => {
    try {
      if (notchWindow && !notchWindow.isDestroyed()) {
        // Apply settings to the existing window
        const notchSettings = settingsManager.getNotchSettings();

        // Apply always on top setting
        notchWindow.setAlwaysOnTop(notchSettings.alwaysOnTop);

        // Apply opacity setting
        if (typeof notchSettings.opacity === "number") {
          // Set window opacity
          notchWindow.setOpacity(notchSettings.opacity);

          // Save this in the console for debugging
          console.log(`Applied opacity setting: ${notchSettings.opacity}`);
        }

        // Apply position and size if needed
        if (notchSettings.width && notchSettings.height) {
          notchWindow.setSize(notchSettings.width, notchSettings.height);
        }

        // Reload window contents to apply theme changes
        notchWindow.webContents.reloadIgnoringCache();

        // Return success
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing notch window:", error);
      return false;
    }
  });

  // Toggle always on top
  ipcMain.handle("toggle-always-on-top", () => {
    if (notchWindow) {
      const alwaysOnTop = !notchWindow.isAlwaysOnTop();
      notchWindow.setAlwaysOnTop(alwaysOnTop);
      settingsManager.setNotchAlwaysOnTop(alwaysOnTop);
      return alwaysOnTop;
    }
    return false;
  });

  // Toggle start on boot
  ipcMain.handle("toggle-start-on-boot", () => {
    try {
      const currentValue = settingsManager.getStartOnBoot();
      const newValue = !currentValue;

      settingsManager.setStartOnBoot(newValue);
      updateStartupSettings(); // Apply the change immediately

      return newValue;
    } catch (error) {
      console.error("Error toggling start on boot:", error);
      return false;
    }
  });

  // Handle window dragging
  ipcMain.on("window-drag-start", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      // Electron doesn't have a direct startDrag method for windows
      // Instead use executeJavaScript to interact with the DOM
      win.webContents.executeJavaScript('console.log("Starting window drag");');

      // We can't directly drag the window from here as there's no native API
      // provided by Electron for this. Instead, we ensure the window is movable.
      win.setMovable(true);

      // The actual dragging behavior will be handled in the renderer
      // by using mousedown events on the drag handle
    }
  });

  // Enable native file dragging from the app to other applications
  ipcMain.handle("start-native-drag", async (event, filePaths) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        console.error("No window found for native drag");
        return false;
      }

      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        console.error("No valid file paths provided for native drag");
        return false;
      }

      // Filter out non-existent files
      const validPaths = filePaths.filter((filePath) => {
        try {
          const exists = fs.existsSync(filePath);
          if (!exists) {
            console.warn(`File does not exist: ${filePath}`);
          }
          return exists;
        } catch (error) {
          console.error(`Error checking if file exists: ${filePath}`, error);
          return false;
        }
      });

      if (validPaths.length === 0) {
        console.error("No valid file paths exist for native drag");
        return false;
      }

      console.log(
        `Starting native drag for ${validPaths.length} files:`,
        validPaths
      );

      // Get the appropriate icon path for production or development
      let iconPath;
      if (process.env.NODE_ENV === "development") {
        iconPath = path.join(__dirname, "../../public/icons/icon.ico");
      } else {
        // In production, icon is in the resources folder or in a different location
        const possiblePaths = [
          path.join(__dirname, "../renderer/icons/icon.ico"),
          path.join(__dirname, "../../renderer/icons/icon.ico"),
          path.join(app.getAppPath(), "icons/icon.ico"),
          path.join(
            process.resourcesPath,
            "app.asar.unpacked/public/icons/icon.ico"
          ),
          path.join(process.resourcesPath, "icons/icon.ico"),
        ];

        iconPath = possiblePaths.find((p) => {
          try {
            return fs.existsSync(p);
          } catch {
            return false;
          }
        });

        if (!iconPath) {
          console.warn("Icon not found, using first file as icon");
          iconPath = validPaths[0]; // Use the first file as the icon if no icon is found
        }
      }

      console.log("Using icon:", iconPath);

      // Create options object that works with Electron's API
      let dragOptions: DragOptions;
      if (validPaths.length === 1) {
        dragOptions = { file: validPaths[0] };
        if (iconPath) dragOptions.icon = iconPath;
      } else {
        dragOptions = { files: validPaths };
        if (iconPath) dragOptions.icon = iconPath;
      }

      console.log("Drag options:", JSON.stringify(dragOptions, null, 2));

      // Use the appropriate method to start the drag
      try {
        // For newer Electron versions (recommended approach)
        if (
          win.webContents &&
          typeof win.webContents.startDrag === "function"
        ) {
          console.log("Using webContents.startDrag method");
          win.webContents.startDrag(dragOptions as any);
          return true;
        }
        // For older Electron versions (fallback)
        else if (typeof (win as any).startDrag === "function") {
          console.log("Using window.startDrag method");
          (win as any).startDrag(dragOptions);
          return true;
        } else {
          console.warn(
            "No drag method available - copying to clipboard instead"
          );
          clipboard.writeText(validPaths.join("\n"));
          return false;
        }
      } catch (dragError) {
        console.error("Error in drag operation:", dragError);
        // Fallback to clipboard
        try {
          clipboard.writeText(validPaths.join("\n"));
          console.log("Copied file paths to clipboard as fallback");
        } catch (clipboardError) {
          console.error("Could not copy to clipboard:", clipboardError);
        }
        return false;
      }
    } catch (error) {
      console.error("Error starting native drag:", error);
      return false;
    }
  });
}

// Update startup settings based on user preference
function updateStartupSettings() {
  try {
    // Check if the app should start at login
    const startOnBoot = settingsManager.getStartOnBoot();

    // Get the correct path for the executable
    const appPath = process.execPath;

    // Set login item settings
    app.setLoginItemSettings({
      openAtLogin: startOnBoot,
      // Only enable open in background in production to avoid
      // opening multiple instances during development
      openAsHidden: !isDev() && startOnBoot,
      path: appPath,
      args: [],
    });

    console.log(`Start on boot setting updated: ${startOnBoot}`);
  } catch (error) {
    console.error("Error updating startup settings:", error);
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createNotchWindow();
  createTray();
  registerGlobalShortcuts();
  registerIpcHandlers();
  registerFileHandlers(notchWindow, mainWindow);
  updateStartupSettings(); // Apply startup settings
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createNotchWindow();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

// Clean up on app quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
