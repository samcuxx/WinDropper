import { create } from "zustand";

export enum FileType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  ARCHIVE = "archive",
  CODE = "code",
  OTHER = "other",
}

export interface FileInfo {
  id: string;
  path: string;
  name: string;
  extension: string;
  type: FileType;
  size: number;
  lastModified: number;
}

interface FileState {
  files: FileInfo[];
  selectedFiles: Set<string>; // Store IDs of selected files
  isLoading: boolean;
  error: string | null;
  setFiles: (files: FileInfo[]) => void;
  addFiles: (files: FileInfo[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  getFilesByType: () => { [key in FileType]?: FileInfo[] };
  // Selection management
  selectFile: (id: string) => void;
  deselectFile: (id: string) => void;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  getSelectedFiles: () => FileInfo[];
  getSelectedFilePaths: () => string[];
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFiles: new Set<string>(),
  isLoading: false,
  error: null,

  setFiles: (files) =>
    set({
      files: Array.isArray(files) ? files : [],
      selectedFiles: new Set<string>(), // Clear selection when files change
      isLoading: false,
      error: null,
    }),

  addFiles: (newFiles) =>
    set((state) => {
      if (!Array.isArray(newFiles)) {
        console.error("addFiles received non-array:", newFiles);
        return state;
      }

      // Filter out duplicates based on file path
      const existingPaths = new Set(state.files.map((file) => file.path));
      const filesToAdd = newFiles.filter(
        (file) => !existingPaths.has(file.path)
      );
      return {
        files: [...state.files, ...filesToAdd],
        isLoading: false,
        error: null,
      };
    }),

  removeFile: (id) =>
    set((state) => {
      // Remove from selection if needed
      const newSelection = new Set(state.selectedFiles);
      newSelection.delete(id);

      return {
        files: state.files.filter((file) => file.id !== id),
        selectedFiles: newSelection,
      };
    }),

  clearFiles: () =>
    set({
      files: [],
      selectedFiles: new Set<string>(),
      isLoading: false,
      error: null,
    }),

  // Group files by type
  getFilesByType: () => {
    const { files } = get();
    if (!Array.isArray(files) || files.length === 0) {
      return {};
    }

    try {
      return files.reduce((acc, file) => {
        if (!acc[file.type]) {
          acc[file.type] = [];
        }
        acc[file.type]!.push(file);
        return acc;
      }, {} as { [key in FileType]?: FileInfo[] });
    } catch (error) {
      console.error("Error in getFilesByType:", error);
      return {};
    }
  },

  // Selection management functions
  selectFile: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedFiles);
      newSelection.add(id);
      return { selectedFiles: newSelection };
    }),

  deselectFile: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedFiles);
      newSelection.delete(id);
      return { selectedFiles: newSelection };
    }),

  toggleFileSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedFiles);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedFiles: newSelection };
    }),

  selectAllFiles: () =>
    set((state) => {
      const allIds = state.files.map((file) => file.id);
      return { selectedFiles: new Set(allIds) };
    }),

  deselectAllFiles: () => set({ selectedFiles: new Set<string>() }),

  getSelectedFiles: () => {
    const { files, selectedFiles } = get();
    return files.filter((file) => selectedFiles.has(file.id));
  },

  getSelectedFilePaths: () => {
    const { files, selectedFiles } = get();
    return files
      .filter((file) => selectedFiles.has(file.id))
      .map((file) => file.path);
  },
}));
