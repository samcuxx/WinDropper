import { ipcMain, BrowserWindow, clipboard, shell, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { createSettingsManager } from "./settingsManager";

interface FileInfo {
  id: string;
  path: string;
  name: string;
  extension: string;
  type: FileType;
  size: number;
  icon?: string;
  lastModified: number;
}

enum FileType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  ARCHIVE = "archive",
  CODE = "code",
  OTHER = "other",
}

// File stacks
let stackedFiles: FileInfo[] = [];

// Create settings manager instance
const settingsManager = createSettingsManager();

// Get file type based on extension
function getFileType(extension: string): FileType {
  const ext = extension.toLowerCase();
  if (
    [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"].includes(
      ext
    )
  ) {
    return FileType.IMAGE;
  } else if (
    [
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".pdf",
      ".txt",
      ".rtf",
      ".odt",
    ].includes(ext)
  ) {
    return FileType.DOCUMENT;
  } else if (
    [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"].includes(ext)
  ) {
    return FileType.VIDEO;
  } else if ([".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma"].includes(ext)) {
    return FileType.AUDIO;
  } else if ([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"].includes(ext)) {
    return FileType.ARCHIVE;
  } else if (
    [
      ".js",
      ".ts",
      ".py",
      ".java",
      ".c",
      ".cpp",
      ".cs",
      ".html",
      ".css",
      ".php",
      ".rb",
      ".go",
      ".rs",
    ].includes(ext)
  ) {
    return FileType.CODE;
  } else {
    return FileType.OTHER;
  }
}

// Get file information
function getFileInfo(filePath: string): FileInfo {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);

  return {
    id: `${fileName}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`,
    path: filePath,
    name: fileName,
    extension: ext,
    type: getFileType(ext),
    size: stats.size,
    lastModified: stats.mtimeMs,
  };
}

// Notify renderer about file updates
function notifyFileUpdates(window: BrowserWindow | null) {
  if (window) {
    window.webContents.send("files-updated", stackedFiles);
  }
}

// Send notification to renderer
function sendNotification(
  window: BrowserWindow | null,
  title: string,
  body: string
) {
  if (window) {
    window.webContents.send("notification", { title, body });
  }
}

// Register file handlers
export function registerFileHandlers(
  notchWindow: BrowserWindow | null,
  _mainWindow: BrowserWindow | null
) {
  // Handle file drop
  ipcMain.handle("drop-files", async (_, filePaths: string[]) => {
    try {
      // Get existing file paths for duplicate checking
      const existingPaths = new Set(stackedFiles.map((file) => file.path));

      // Filter out duplicate files
      const newPaths = filePaths.filter((path) => !existingPaths.has(path));
      const duplicateCount = filePaths.length - newPaths.length;

      // Process only new, non-duplicate files
      const newFiles = newPaths.map((filePath) => getFileInfo(filePath));

      // Add new files to the stack
      if (newFiles.length > 0) {
        stackedFiles = [...stackedFiles, ...newFiles];
        notifyFileUpdates(notchWindow);
      }

      // Show appropriate notification based on results
      if (duplicateCount > 0) {
        if (newFiles.length > 0) {
          // Some duplicates, some new files
          sendNotification(
            notchWindow,
            "Files Added",
            `Added ${newFiles.length} files. Skipped ${duplicateCount} duplicate file(s).`
          );
        } else {
          // All duplicates
          sendNotification(
            notchWindow,
            "Duplicate Files",
            `All ${duplicateCount} file(s) already exist in the dropper.`
          );
        }
      } else if (newFiles.length > 0) {
        // All new files
        sendNotification(
          notchWindow,
          "Files Added",
          `Added ${newFiles.length} files to the dropper.`
        );
      }

      return stackedFiles;
    } catch (error) {
      console.error("Error processing dropped files:", error);
      sendNotification(
        notchWindow,
        "Error",
        "Failed to process dropped files."
      );
      return stackedFiles;
    }
  });

  // Clear the stack
  ipcMain.handle("clear-stack", () => {
    stackedFiles = [];
    notifyFileUpdates(notchWindow);
    sendNotification(
      notchWindow,
      "Stack Cleared",
      "All files have been removed from the stack."
    );
    return [];
  });

  // Move files to destination
  ipcMain.handle(
    "move-files-to-destination",
    async (_, destinationPath: string) => {
      try {
        if (!fs.existsSync(destinationPath)) {
          fs.mkdirSync(destinationPath, { recursive: true });
        }

        const fileSettings = settingsManager.getFileSettings();
        const categorizeByType = fileSettings.categorizeByType;

        const results = await Promise.all(
          stackedFiles.map(async (file) => {
            try {
              let targetDir = destinationPath;

              // If categorization is enabled, create subfolders based on file type
              if (categorizeByType) {
                targetDir = path.join(destinationPath, file.type);
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }
              }

              const targetPath = path.join(targetDir, file.name);

              // If file already exists, add a timestamp to the filename
              let finalPath = targetPath;
              if (fs.existsSync(targetPath)) {
                const timestamp = Date.now();
                const extname = path.extname(file.name);
                const basename = path.basename(file.name, extname);
                finalPath = path.join(
                  targetDir,
                  `${basename}_${timestamp}${extname}`
                );
              }

              // Use copyFile instead of rename to work across different drives
              fs.copyFileSync(file.path, finalPath);
              return { success: true, file };
            } catch (error) {
              console.error(`Error moving file ${file.path}:`, error);
              return { success: false, file, error };
            }
          })
        );

        // Add the destination to recent destinations
        settingsManager.addRecentDestination(destinationPath);

        // Count successes and failures
        const successes = results.filter((r) => r.success).length;
        const failures = results.length - successes;

        // Clear the stack
        stackedFiles = [];
        notifyFileUpdates(notchWindow);

        // Notify the user
        if (failures === 0) {
          sendNotification(
            notchWindow,
            "Success",
            `Moved ${successes} files to ${path.basename(destinationPath)}.`
          );
        } else {
          sendNotification(
            notchWindow,
            "Partial Success",
            `Moved ${successes} files, ${failures} failed.`
          );
        }

        return { successes, failures };
      } catch (error) {
        console.error("Error moving files:", error);
        sendNotification(
          notchWindow,
          "Error",
          "Failed to move files to destination."
        );
        return { successes: 0, failures: stackedFiles.length };
      }
    }
  );

  // Copy file paths to clipboard
  ipcMain.handle("copy-file-paths", (_, selectedPaths?: string[]) => {
    // If selected paths are provided, use them; otherwise use all stacked files
    const pathsToCopy = selectedPaths || stackedFiles.map((file) => file.path);
    const filePaths = pathsToCopy.join("\n");
    clipboard.writeText(filePaths);
    sendNotification(
      notchWindow,
      "Copied",
      `${pathsToCopy.length} file paths copied to clipboard.`
    );
    return true;
  });

  // Open containing folder
  ipcMain.handle("open-containing-folder", (_, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return true;
    } catch (error) {
      console.error("Error opening containing folder:", error);
      sendNotification(
        notchWindow,
        "Error",
        "Failed to open containing folder."
      );
      return false;
    }
  });

  // Remove file from stack
  ipcMain.handle("remove-file-from-stack", (_, filePath: string) => {
    stackedFiles = stackedFiles.filter((file) => file.path !== filePath);
    notifyFileUpdates(notchWindow);
    return stackedFiles;
  });

  // Select destination folder
  ipcMain.handle("select-destination-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Destination Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}
