import { create } from 'zustand';

export interface FileUploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  result?: any;
  error?: string;
  transcriptionJobId?: string;
  successMessage?: string;
}

interface UploadQueueState {
  uploadFiles: FileUploadFile[];
  activeUploads: Map<string, File>; // Store actual File objects for active uploads
  setUploadFiles: (files: FileUploadFile[] | ((prev: FileUploadFile[]) => FileUploadFile[])) => void;
  addUploadFile: (file: FileUploadFile) => void;
  updateUploadFile: (id: string, updates: Partial<FileUploadFile>) => void;
  removeUploadFile: (id: string) => void;
  clearUploadQueue: () => void;
  setActiveFile: (id: string, file: File) => void;
  removeActiveFile: (id: string) => void;
}

export const useUploadQueueStore = create<UploadQueueState>()((set, get) => ({
  uploadFiles: [],
  activeUploads: new Map(),
      
      setUploadFiles: (files) => {
        set({ 
          uploadFiles: typeof files === 'function' ? files(get().uploadFiles) : files 
        });
      },
      
      addUploadFile: (file) => {
        set((state) => ({
          uploadFiles: [...state.uploadFiles, file]
        }));
      },
      
      updateUploadFile: (id, updates) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          )
        }));
      },
      
      removeUploadFile: (id) => {
        set((state) => ({
          uploadFiles: state.uploadFiles.filter((f) => f.id !== id)
        }));
        get().removeActiveFile(id);
      },
      
      clearUploadQueue: () => {
        set({ uploadFiles: [], activeUploads: new Map() });
      },
      
      setActiveFile: (id, file) => {
        set((state) => {
          const newActiveUploads = new Map(state.activeUploads);
          newActiveUploads.set(id, file);
          return { activeUploads: newActiveUploads };
        });
      },
      
      removeActiveFile: (id) => {
        set((state) => {
          const newActiveUploads = new Map(state.activeUploads);
          newActiveUploads.delete(id);
          return { activeUploads: newActiveUploads };
        });
      }
}));