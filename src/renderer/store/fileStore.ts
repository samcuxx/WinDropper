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
  isLoading: boolean;
  error: string | null;
  setFiles: (files: FileInfo[]) => void;
  addFiles: (files: FileInfo[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  getFilesByType: () => { [key in FileType]?: FileInfo[] };
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  isLoading: false,
  error: null,

  setFiles: (files) =>
    set({
      files: Array.isArray(files) ? files : [],
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
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),

  clearFiles: () => set({ files: [], isLoading: false, error: null }),

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
}));
