import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useFileStore, FileInfo, FileType } from "../store/fileStore";
import { useSettingsStore } from "../store/settingsStore";
import { FileItem } from "./FileItem";
import { ContextMenu } from "./ContextMenu";

// Enhanced window dragging handler
const useDrag = () => {
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingWindow(true);

    // Signal to Electron that dragging has started
    try {
      window.electron.startDrag();
    } catch (error) {
      console.error("Error starting window drag:", error);
    }
  };

  const handleDragEnd = () => {
    setIsDraggingWindow(false);
  };

  useEffect(() => {
    if (isDraggingWindow) {
      // Add listeners to track when dragging ends
      const handleMouseUp = () => {
        setIsDraggingWindow(false);
      };

      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingWindow]);

  return {
    isDraggingWindow,
    handleDragStart,
    handleDragEnd,
  };
};

export const Notch: React.FC = () => {
  const {
    files,
    setFiles,
    clearFiles,
    selectedFiles,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    getSelectedFiles,
    getSelectedFilePaths,
  } = useFileStore();
  const { settings, loadSettings } = useSettingsStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notchRef = useRef<HTMLDivElement>(null);

  // Use enhanced drag handler
  const { isDraggingWindow, handleDragStart, handleDragEnd } = useDrag();

  // Load settings and register file update listener
  useEffect(() => {
    setIsLoading(true);
    loadSettings()
      .then(() => {
        setIsLoading(false);

        // Try to get current always-on-top state
        try {
          window.electron
            .getSettings()
            .then((settings) => {
              if (settings && settings.notch) {
                setIsAlwaysOnTop(settings.notch.alwaysOnTop);
              }
            })
            .catch((err) =>
              console.error("Error getting always-on-top state:", err)
            );
        } catch (error) {
          console.error("Error checking always-on-top state:", error);
        }
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
        setIsLoading(false);
      });

    // Listen for file updates from main process
    const unsubscribe = window.electron.onFilesUpdated((updatedFiles) => {
      try {
        setFiles(updatedFiles || []);
      } catch (error) {
        console.error("Error updating files:", error);
        setError("Failed to update files");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadSettings, setFiles]);

  // Handle files dropped into the notch
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    // Get file paths from drop event
    const filePaths: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          // Get file path from Electron (this is Windows specific and requires the IPC bridge)
          // @ts-ignore - The 'path' property is available in Electron's file drop
          const filePath = file.path;
          if (filePath) {
            filePaths.push(filePath);
          }
        }
      }
    }

    if (filePaths.length > 0) {
      try {
        await window.electron.dropFiles(filePaths);
      } catch (error) {
        console.error("Error dropping files:", error);
      }
    }
  };

  // Handle context menu for files
  const handleContextMenu = (e: React.MouseEvent, file?: FileInfo) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedFile(file || null);
    setShowContextMenu(true);
  };

  // Hide context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Toggle always on top
  const toggleAlwaysOnTop = async () => {
    try {
      const result = await window.electron.toggleAlwaysOnTop();
      setIsAlwaysOnTop(result);
    } catch (error) {
      console.error("Error toggling always on top:", error);
    }
  };

  // Clear the stack
  const handleClearStack = async () => {
    try {
      await window.electron.clearStack();
      clearFiles();
    } catch (error) {
      console.error("Error clearing stack:", error);
    }
  };

  // Copy all file paths
  const handleCopyFilePaths = async () => {
    try {
      if (!files || files.length === 0) return;

      console.log("Copying file paths...");

      // Get selected file paths or use all files if none selected
      const selectedFiles = getSelectedFiles();
      const pathsToCopy =
        selectedFiles.length > 0 ? getSelectedFilePaths() : null; // null will copy all files

      const success = await window.electron.copyFilePaths(pathsToCopy);

      if (success) {
        const count =
          selectedFiles.length > 0 ? selectedFiles.length : files.length;
        console.log(`${count} file paths copied successfully`);
      } else {
        console.error("Failed to copy file paths");
      }
    } catch (error) {
      console.error("Error copying file paths:", error);
    }
  };

  // Move files to destination
  const handleMoveFiles = async (destinationPath: string) => {
    try {
      if (!destinationPath) {
        console.error("No destination path provided");
        return;
      }

      console.log(`Moving files to destination: ${destinationPath}`);

      const result = await window.electron.moveFilesToDestination(
        destinationPath
      );

      if (result) {
        console.log(
          `Moved files: ${result.successes} successes, ${result.failures} failures`
        );

        // If we have the settings, add this destination to recent list
        if (settings && settings.files) {
          loadSettings(); // Reload settings to get updated recent destinations
        }
      }
    } catch (error) {
      console.error("Error moving files:", error);
    } finally {
      // Close context menu after operation
      setShowContextMenu(false);
    }
  };

  // Handle multi-file native drag
  const handleMultiFileDrag = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedFilesArray = getSelectedFiles();
    if (selectedFilesArray.length === 0) return;

    try {
      // Add a custom effect to indicate drag
      e.dataTransfer.effectAllowed = "copyMove";

      // Set drag image to first file in selection
      if (e.target && selectedFilesArray.length > 0) {
        const element = e.target as HTMLElement;
        e.dataTransfer.setDragImage(element, 20, 20);
      }

      // Set the paths for all selected files
      const selectedPaths = getSelectedFilePaths();
      e.dataTransfer.setData("text/plain", selectedPaths.join("\n"));

      // Set dragging state for visual feedback
      setIsDragging(true);

      // Log which files are being dragged
      console.log(
        `Starting drag for ${selectedPaths.length} files:`,
        selectedPaths
      );

      // Copy to clipboard as fallback
      navigator.clipboard
        .writeText(selectedPaths.join("\n"))
        .then(() => {
          console.log("Selected file paths copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy selected file paths during drag:", err);
        });

      // Use native drag for all selected files
      if (window.electron && window.electron.startNativeDrag) {
        try {
          // Use immediate execution instead of setTimeout to ensure it happens immediately
          window.electron
            .startNativeDrag(selectedPaths)
            .then((success) => {
              if (success) {
                console.log(
                  "Native multi-file drag successful:",
                  selectedPaths.length,
                  "files"
                );
              } else {
                console.log(
                  "Native multi-file drag returned false, using clipboard fallback"
                );
              }
            })
            .catch((err) => {
              console.error("Native multi-file drag error:", err);
              console.log("Using clipboard fallback");
            });
        } catch (nativeDragError) {
          console.error(
            "Exception in native multi-file drag:",
            nativeDragError
          );
          console.log("Using clipboard fallback");
        }
      }
    } catch (error) {
      console.error("Error in multi-file drag start:", error);
      setIsDragging(false);
    }
  };

  // Add drag end handler for multi-drag
  const handleMultiDragEnd = () => {
    console.log("Multi-file drag ended");
    setIsDragging(false);
  };

  // Handle select all files
  const handleSelectAllFiles = () => {
    if (files.length === 0) return;

    if (getSelectedFiles().length === files.length) {
      // If all files are already selected, deselect all
      deselectAllFiles();
    } else {
      // Otherwise select all
      selectAllFiles();
    }

    setShowContextMenu(false);
  };

  // Context menu options
  const getContextMenuOptions = () => {
    const selectedCount = getSelectedFiles().length;

    const options = [
      // Options for selected file
      ...(selectedFile
        ? [
            {
              label: "Copy Path",
              onClick: () => {
                if (selectedFile) {
                  try {
                    navigator.clipboard.writeText(selectedFile.path);
                    console.log(`Copied path: ${selectedFile.path}`);
                  } catch (error) {
                    console.error("Error copying to clipboard:", error);
                  }
                }
                setShowContextMenu(false);
              },
            },
            {
              label: "Open Containing Folder",
              onClick: () => {
                if (selectedFile) {
                  window.electron.openContainingFolder(selectedFile.path);
                }
                setShowContextMenu(false);
              },
            },
            {
              label: "Remove from Stack",
              onClick: () => {
                if (selectedFile) {
                  window.electron.removeFileFromStack(selectedFile.path);
                }
                setShowContextMenu(false);
              },
            },
            { type: "separator" as const },
          ]
        : []),

      // General options
      {
        label: "Select All Files",
        onClick: handleSelectAllFiles,
        disabled: files.length === 0,
      },
      {
        label:
          selectedCount > 0
            ? `Copy Selected Paths (${selectedCount})`
            : "Copy All Paths",
        onClick: handleCopyFilePaths,
        disabled: files.length === 0,
      },
      {
        label: "Clear Stack",
        onClick: handleClearStack,
        disabled: files.length === 0,
      },
      {
        label: isAlwaysOnTop ? "Disable Always on Top" : "Enable Always on Top",
        onClick: toggleAlwaysOnTop,
      },
    ];

    // Recent destinations submenu
    const recentDestinationsMenu = (
      settings?.files?.recentDestinations || []
    ).map((destination) => ({
      label: destination.split("\\").pop() || destination,
      onClick: () => handleMoveFiles(destination),
    }));

    // Add move to destinations menu if we have files
    if (files && files.length > 0) {
      options.push({ type: "separator" as const });
      options.push({
        label: "Move to",
        submenu: [
          {
            label: "Default Location",
            onClick: () => {
              if (settings?.files?.defaultDestination) {
                handleMoveFiles(settings.files.defaultDestination);
              }
            },
            disabled: !settings?.files?.defaultDestination,
          },
          ...(settings?.files?.recentDestinations?.length > 0
            ? [{ type: "separator" as const }]
            : []),
          ...(recentDestinationsMenu || []),
          { type: "separator" as const },
          {
            label: "Choose Folder...",
            onClick: async () => {
              try {
                const destination =
                  await window.electron.selectDestinationFolder();
                if (destination) {
                  handleMoveFiles(destination);
                }
              } catch (error) {
                console.error("Error selecting destination folder:", error);
              }
            },
          },
        ],
      });
    }

    return options;
  };

  // renderFiles function to safely handle files array
  const renderFiles = () => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">Drag and drop files here</p>
        </div>
      );
    }

    const selectedCount = getSelectedFiles().length;
    const isMultiDraggable = selectedCount > 0;

    return (
      <div className="space-y-1">
        {/* Select all checkbox when files exist */}
        {files.length > 0 && (
          <div className="flex items-center p-1 mb-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={
                getSelectedFiles().length === files.length && files.length > 0
              }
              onChange={handleSelectAllFiles}
              className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500 border-gray-300 cursor-pointer mr-2"
              aria-label="Select all files"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getSelectedFiles().length === 0
                ? "Select all"
                : `Selected ${getSelectedFiles().length} of ${files.length}`}
            </span>
          </div>
        )}

        {/* Files list with multi-drag container */}
        <div
          className={`space-y-1 ${
            isMultiDraggable
              ? "bg-windropper-50 dark:bg-windropper-900/10 p-2 rounded-md border border-dashed border-windropper-200 dark:border-windropper-700"
              : ""
          }`}
          draggable={isMultiDraggable}
          onDragStart={handleMultiFileDrag}
          onDragEnd={handleMultiDragEnd}
        >
          {isMultiDraggable && (
            <div className="text-xs text-center text-windropper-500 mb-2 font-medium">
              {selectedCount === 1
                ? "Drag 1 file"
                : `Drag ${selectedCount} files`}
            </div>
          )}

          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isSelected={selectedFiles.has(file.id)}
              onSelect={toggleFileSelection}
              onContextMenu={(e) => handleContextMenu(e, file)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <motion.div
        ref={notchRef}
        className={`windropper-notch flex flex-col h-full w-full p-1 overflow-hidden ${
          isDragging ? "drag-over" : ""
        } ${!files || files.length === 0 ? "windropper-empty-notch" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onContextMenu={(e) => handleContextMenu(e)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Handle/title bar */}
        <div className="flex items-center justify-between p-2 draggable-area">
          <div
            className="windropper-handle select-none"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </div>

          <div className="flex space-x-1">
            {/* Add selected counter badge when files are selected */}
            {getSelectedFiles().length > 0 && (
              <div className="bg-windropper-500 text-white text-xs rounded-full px-2 py-0.5 flex items-center justify-center">
                {getSelectedFiles().length}
              </div>
            )}

            <button
              onClick={handleCopyFilePaths}
              disabled={!files || files.length === 0}
              className={`windropper-button p-1 rounded ${
                !files || files.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Copy All Paths"
              aria-label="Copy all file paths"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
            </button>

            <button
              onClick={handleClearStack}
              disabled={!files || files.length === 0}
              className={`windropper-button p-1 rounded ${
                !files || files.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Clear Stack"
              aria-label="Clear all files from stack"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            <button
              onClick={toggleAlwaysOnTop}
              className={`windropper-button p-1 rounded ${
                isAlwaysOnTop
                  ? "text-windropper-500"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              title={
                isAlwaysOnTop ? "Disable Always on Top" : "Enable Always on Top"
              }
              aria-label={
                isAlwaysOnTop ? "Disable always on top" : "Enable always on top"
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-auto p-2">{renderFiles()}</div>
      </motion.div>

      {/* Context menu */}
      {showContextMenu && (
        <ContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          options={getContextMenuOptions()}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};
