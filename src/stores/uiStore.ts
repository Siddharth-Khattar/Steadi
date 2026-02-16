// ABOUTME: Zustand store for UI state (sidebar visibility, preview panel visibility).
// ABOUTME: Persists user preferences across app restarts via Tauri store plugin.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tauriJSONStorage } from "../persistence/tauriStorage";

interface UIState {
  sidebarVisible: boolean;
  previewVisible: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  togglePreview: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setPreviewVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      previewVisible: false,

      toggleSidebar: () => {
        set((state) => ({ sidebarVisible: !state.sidebarVisible }));
      },

      togglePreview: () => {
        set((state) => ({ previewVisible: !state.previewVisible }));
      },

      setSidebarVisible: (visible: boolean) => {
        set({ sidebarVisible: visible });
      },

      setPreviewVisible: (visible: boolean) => {
        set({ previewVisible: visible });
      },
    }),
    {
      name: "ui-store",
      storage: tauriJSONStorage,
    },
  ),
);
