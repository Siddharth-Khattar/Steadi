// ABOUTME: Toolbar at the top of the sidebar with buttons for creating new scripts and folders.
// ABOUTME: Handles the "no folders yet" case by auto-creating a default folder for scripts.

import { useScriptStore } from "../../stores/scriptStore";

/**
 * Horizontal toolbar rendered at the top of the sidebar.
 * Provides "New Script" and "New Folder" creation buttons.
 */
export function SidebarToolbar() {
  const folders = useScriptStore((s) => s.folders);
  const createFolder = useScriptStore((s) => s.createFolder);
  const createScript = useScriptStore((s) => s.createScript);

  function handleNewScript() {
    let targetFolderId: string;

    if (folders.length === 0) {
      // Auto-create a default folder, then create a script inside it.
      // createFolder is sync and updates the store immediately.
      createFolder("Scripts");
      const updatedFolders = useScriptStore.getState().folders;
      const defaultFolder = updatedFolders[updatedFolders.length - 1];
      targetFolderId = defaultFolder.id;
    } else {
      // Use the first folder (by order) as the target.
      const sorted = [...folders].sort((a, b) => a.order - b.order);
      targetFolderId = sorted[0].id;
    }

    createScript(targetFolderId, "Untitled");
  }

  function handleNewFolder() {
    createFolder("New Folder");
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
      <button
        type="button"
        onClick={handleNewScript}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/60 hover:text-white/80 hover:bg-white/10 transition-colors"
        title="New Script"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span>Script</span>
      </button>

      <button
        type="button"
        onClick={handleNewFolder}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/60 hover:text-white/80 hover:bg-white/10 transition-colors"
        title="New Folder"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
        <span>Folder</span>
      </button>
    </div>
  );
}
