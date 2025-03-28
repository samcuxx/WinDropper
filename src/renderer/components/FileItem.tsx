import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileInfo, FileType } from "../store/fileStore";

interface FileItemProps {
  file: FileInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  isSelected,
  onSelect,
  onContextMenu,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(file.id);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const base = 1024;
    const decimalPoint = 1;
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));

    return (
      parseFloat((bytes / Math.pow(base, unitIndex)).toFixed(decimalPoint)) +
      " " +
      units[unitIndex]
    );
  };

  // Get icon based on file type
  const getFileIcon = (): string => {
    switch (file.type) {
      case FileType.IMAGE:
        return "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
      case FileType.DOCUMENT:
        return "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
      case FileType.VIDEO:
        return "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z";
      case FileType.AUDIO:
        return "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3";
      case FileType.ARCHIVE:
        return "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4";
      case FileType.CODE:
        return "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4";
      default:
        return "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
    }
  };

  // Get color based on file type
  const getTypeColor = (): string => {
    switch (file.type) {
      case FileType.IMAGE:
        return "text-green-500";
      case FileType.DOCUMENT:
        return "text-blue-500";
      case FileType.VIDEO:
        return "text-purple-500";
      case FileType.AUDIO:
        return "text-yellow-500";
      case FileType.ARCHIVE:
        return "text-orange-500";
      case FileType.CODE:
        return "text-pink-500";
      default:
        return "text-gray-500";
    }
  };

  // Handle file drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // For dragging outside of window, set the files on the event
    if (e.dataTransfer) {
      try {
        // We need to prevent default to use our custom implementation
        e.preventDefault();
        e.stopPropagation();

        // Add a custom effect to indicate drag
        e.dataTransfer.effectAllowed = "copyMove";

        // Set the drag image if possible
        if (fileRef.current) {
          e.dataTransfer.setDragImage(fileRef.current, 20, 20);
        }

        // Set the drag data in multiple formats for maximum compatibility
        e.dataTransfer.setData("text/plain", file.path);
        e.dataTransfer.setData(
          "text/uri-list",
          "file://" + file.path.replace(/\\/g, "/")
        );
        e.dataTransfer.setData("application/json", JSON.stringify(file));

        // Set dragging state for visual feedback
        setIsDragging(true);

        // Copy path to clipboard as a fallback
        navigator.clipboard
          .writeText(file.path)
          .then(() => {
            console.log("File path copied to clipboard for drag fallback");
          })
          .catch((err) => {
            console.error("Failed to copy file path during drag:", err);
          });

        // Use the native drag API through Electron
        if (window.electron && window.electron.startNativeDrag) {
          console.log("Starting native drag for file:", file.path);

          // We don't use setTimeout here to ensure immediate execution
          window.electron
            .startNativeDrag([file.path])
            .then((success) => {
              if (success) {
                console.log("Native drag started successfully");
              } else {
                console.log("Native drag failed, using clipboard fallback");
              }
            })
            .catch((err) => {
              console.error("Error in startNativeDrag:", err);
              console.log("Using clipboard fallback for drag operation");
            });
        } else {
          console.warn("startNativeDrag is not available");
        }
      } catch (error) {
        console.error("Error in drag start:", error);
        setIsDragging(false);
      }
    }
  };

  // Add drag end handler to reset state
  const handleDragEnd = () => {
    console.log("Drag ended");
    setIsDragging(false);
  };

  return (
    <motion.div
      ref={fileRef}
      className={`file-item flex items-center p-2 rounded-md draggable ${
        isDragging ? "dragging" : ""
      } ${
        isSelected
          ? "bg-windropper-100 dark:bg-windropper-900/30 border border-windropper-500"
          : ""
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Selection checkbox */}
      <div className="mr-2 flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}} // Controlled by parent
          onClick={handleSelect}
          className="h-4 w-4 text-windropper-500 rounded focus:ring-windropper-500 border-gray-300 cursor-pointer"
          aria-label={`Select ${file.name}`}
        />
      </div>

      <div className={`flex-shrink-0 mr-3 ${getTypeColor()}`}>
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={getFileIcon()}
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {file.name}
        </div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </div>
      </div>
    </motion.div>
  );
};
