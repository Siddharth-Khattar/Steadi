// ABOUTME: Zustand store for scripts and folders state with Tauri-backed persistence.
// ABOUTME: Script metadata persists via Tauri store plugin; content persists via filesystem.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Folder, ScriptMeta } from "../persistence/types";
import {
  initScriptsDir,
  saveScriptContent,
  loadScriptContent,
  deleteScriptFile,
} from "../persistence/scriptFiles";
import { tauriJSONStorage } from "../persistence/tauriStorage";
import { extractMarkdownMeta } from "../persistence/markdownMeta";

interface ScriptState {
  folders: Folder[];
  scripts: ScriptMeta[];
  activeScriptId: string | null;
  activeContent: string;
  isLoading: boolean;
}

interface ScriptActions {
  initialize: () => Promise<void>;
  createFolder: (name: string) => void;
  createScript: (folderId: string, title: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  renameScript: (scriptId: string, title: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  setActiveScript: (scriptId: string) => Promise<void>;
  setContent: (content: string) => void;
  saveActiveContent: () => Promise<void>;
  reorderScripts: (folderId: string, scriptIds: string[]) => void;
  moveScript: (scriptId: string, targetFolderId: string) => void;
  toggleFolderCollapse: (folderId: string) => void;
}

function now(): string {
  return new Date().toISOString();
}

export const useScriptStore = create<ScriptState & ScriptActions>()(
  persist(
    (set, get) => ({
      folders: [],
      scripts: [],
      activeScriptId: null,
      activeContent: "",
      isLoading: true,

      initialize: async () => {
        await initScriptsDir();

        const { activeScriptId } = get();
        if (activeScriptId) {
          const content = await loadScriptContent(activeScriptId);
          set({ activeContent: content, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      },

      createFolder: (name: string) => {
        const { folders } = get();
        const folder: Folder = {
          id: crypto.randomUUID(),
          name,
          order: folders.length,
          isCollapsed: false,
        };
        set({ folders: [...folders, folder] });
      },

      createScript: async (folderId: string, title: string) => {
        const { scripts } = get();
        const timestamp = now();
        const id = crypto.randomUUID();

        const scriptsInFolder = scripts.filter(
          (s) => s.folderId === folderId,
        );

        const templateContent = `# ${title}\n\n`;

        const meta: ScriptMeta = {
          id,
          title,
          preview: "",
          folderId,
          order: scriptsInFolder.length,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await saveScriptContent(id, templateContent);

        set({
          scripts: [...scripts, meta],
          activeScriptId: id,
          activeContent: templateContent,
        });
      },

      deleteFolder: async (folderId: string) => {
        const { folders, scripts, activeScriptId } = get();
        const folderScripts = scripts.filter((s) => s.folderId === folderId);

        try {
          for (const script of folderScripts) {
            await deleteScriptFile(script.id);
          }
        } catch (error) {
          console.error(`Failed to delete scripts in folder ${folderId}:`, error);
          throw error;
        }

        const folderScriptIds = new Set(folderScripts.map((s) => s.id));
        const remainingScripts = scripts.filter(
          (s) => !folderScriptIds.has(s.id),
        );
        const remainingFolders = folders.filter((f) => f.id !== folderId);

        const isActiveDeleted =
          activeScriptId !== null && folderScriptIds.has(activeScriptId);

        set({
          folders: remainingFolders,
          scripts: remainingScripts,
          ...(isActiveDeleted
            ? { activeScriptId: null, activeContent: "" }
            : {}),
        });
      },

      deleteScript: async (scriptId: string) => {
        const { scripts, activeScriptId } = get();

        try {
          await deleteScriptFile(scriptId);
        } catch (error) {
          console.error(`Failed to delete script ${scriptId}:`, error);
          throw error;
        }

        const remainingScripts = scripts.filter((s) => s.id !== scriptId);
        const isActiveDeleted = activeScriptId === scriptId;

        set({
          scripts: remainingScripts,
          ...(isActiveDeleted
            ? { activeScriptId: null, activeContent: "" }
            : {}),
        });
      },

      renameScript: (scriptId: string, title: string) => {
        const { scripts } = get();
        set({
          scripts: scripts.map((s) =>
            s.id === scriptId ? { ...s, title, updatedAt: now() } : s,
          ),
        });
      },

      renameFolder: (folderId: string, name: string) => {
        const { folders } = get();
        set({
          folders: folders.map((f) =>
            f.id === folderId ? { ...f, name } : f,
          ),
        });
      },

      setActiveScript: async (scriptId: string) => {
        const { activeScriptId, activeContent, scripts } = get();

        // Flush pending content and update metadata for the previous script before switching
        if (activeScriptId) {
          await saveScriptContent(activeScriptId, activeContent);
          const { title, preview } = extractMarkdownMeta(activeContent);
          set({
            scripts: scripts.map((s) =>
              s.id === activeScriptId
                ? { ...s, title, preview, updatedAt: now() }
                : s,
            ),
          });
        }

        const content = await loadScriptContent(scriptId);
        set({ activeScriptId: scriptId, activeContent: content });
      },

      setContent: (content: string) => {
        set({ activeContent: content });
      },

      saveActiveContent: async () => {
        const { activeScriptId, activeContent, scripts } = get();
        if (!activeScriptId) return;

        await saveScriptContent(activeScriptId, activeContent);

        const { title, preview } = extractMarkdownMeta(activeContent);

        set({
          scripts: scripts.map((s) =>
            s.id === activeScriptId
              ? { ...s, title, preview, updatedAt: now() }
              : s,
          ),
        });
      },

      reorderScripts: (folderId: string, scriptIds: string[]) => {
        const { scripts } = get();
        const idToOrder = new Map(
          scriptIds.map((id, index) => [id, index]),
        );

        set({
          scripts: scripts.map((s) => {
            if (s.folderId !== folderId) return s;
            const newOrder = idToOrder.get(s.id);
            return newOrder !== undefined ? { ...s, order: newOrder } : s;
          }),
        });
      },

      moveScript: (scriptId: string, targetFolderId: string) => {
        const { scripts } = get();
        const targetScripts = scripts.filter(
          (s) => s.folderId === targetFolderId,
        );

        set({
          scripts: scripts.map((s) =>
            s.id === scriptId
              ? {
                  ...s,
                  folderId: targetFolderId,
                  order: targetScripts.length,
                  updatedAt: now(),
                }
              : s,
          ),
        });
      },

      toggleFolderCollapse: (folderId: string) => {
        const { folders } = get();
        set({
          folders: folders.map((f) =>
            f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f,
          ),
        });
      },
    }),
    {
      name: "script-store",
      storage: tauriJSONStorage,
      partialize: (state) => ({
        folders: state.folders,
        scripts: state.scripts,
        activeScriptId: state.activeScriptId,
      }),
    },
  ),
);
