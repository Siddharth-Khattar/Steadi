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
  activeFolderId: string | null;
  activeContent: string;
  isLoading: boolean;
  /** True once disk content has been loaded for the current active script. Prevents saving stale/empty content. */
  contentReady: boolean;
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
      activeFolderId: null,
      activeContent: "",
      isLoading: true,
      contentReady: false,

      initialize: async () => {
        await initScriptsDir();

        // Wait for Zustand persist to finish rehydrating metadata from disk.
        // Without this, activeScriptId may still be null (the default) while
        // the async tauriStorage read is in flight — causing us to skip
        // content loading entirely.
        if (!useScriptStore.persist.hasHydrated()) {
          await new Promise<void>((resolve) => {
            const unsub = useScriptStore.persist.onFinishHydration(() => {
              unsub();
              resolve();
            });
          });
        }

        const { activeScriptId } = get();
        if (activeScriptId) {
          const content = await loadScriptContent(activeScriptId);
          set({ activeContent: content, isLoading: false, contentReady: true });
        } else {
          set({ isLoading: false, contentReady: true });
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
        set({ folders: [...folders, folder], activeFolderId: folder.id });
      },

      createScript: async (folderId: string, title: string) => {
        const {
          activeScriptId: prevId,
          activeContent: prevContent,
          contentReady,
        } = get();

        // Flush the previous script's in-memory content to disk before
        // switching away — mirrors the same guard in setActiveScript.
        if (prevId && contentReady) {
          await saveScriptContent(prevId, prevContent);
          const { title: prevTitle, preview: prevPreview } =
            extractMarkdownMeta(prevContent);
          set({
            scripts: get().scripts.map((s) =>
              s.id === prevId
                ? {
                    ...s,
                    title: prevTitle,
                    preview: prevPreview,
                    updatedAt: now(),
                  }
                : s,
            ),
          });
        }

        const latestScripts = get().scripts;
        const timestamp = now();
        const id = crypto.randomUUID();

        const scriptsInFolder = latestScripts.filter(
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
          scripts: [...latestScripts, meta],
          activeScriptId: id,
          activeFolderId: folderId,
          activeContent: templateContent,
          contentReady: true,
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
          console.error(
            `Failed to delete scripts in folder ${folderId}:`,
            error,
          );
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
            ? { activeScriptId: null, activeContent: "", contentReady: false }
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
            ? { activeScriptId: null, activeContent: "", contentReady: false }
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
          folders: folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
          activeFolderId: folderId,
        });
      },

      setActiveScript: async (scriptId: string) => {
        const { activeScriptId, activeContent, scripts, contentReady } = get();

        // Flush pending content and update metadata for the previous script before switching.
        // Only save if contentReady is true — otherwise activeContent is still the default
        // empty string from before disk content was loaded, and saving would destroy the file.
        if (activeScriptId && contentReady) {
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
        const script = get().scripts.find((s) => s.id === scriptId);
        set({
          activeScriptId: scriptId,
          activeFolderId: script?.folderId ?? get().activeFolderId,
          activeContent: content,
          contentReady: true,
        });
      },

      setContent: (content: string) => {
        set({ activeContent: content });
      },

      saveActiveContent: async () => {
        const { activeScriptId, activeContent, scripts, contentReady } = get();
        if (!activeScriptId || !contentReady) return;

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
        const idToOrder = new Map(scriptIds.map((id, index) => [id, index]));

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
          activeFolderId: folderId,
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
        activeFolderId: state.activeFolderId,
      }),
    },
  ),
);
