// ABOUTME: Collapsible folder component in the sidebar file tree containing sortable script items.
// ABOUTME: Supports expand/collapse, right-click context menu for rename/delete, and drag-and-drop reordering.

import { useState, useRef, useEffect, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Folder, ScriptMeta } from "../../persistence/types";
import { useScriptStore } from "../../stores/scriptStore";
import { ScriptItem } from "./ScriptItem";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface FolderItemProps {
  folder: Folder;
  scripts: ScriptMeta[];
  activeScriptId: string | null;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

/**
 * A collapsible folder in the sidebar file tree. Each folder contains a
 * SortableContext wrapping its ScriptItem children for drag-and-drop reordering.
 */
export function FolderItem({
  folder,
  scripts,
  activeScriptId,
}: FolderItemProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const toggleFolderCollapse = useScriptStore((s) => s.toggleFolderCollapse);
  const renameFolder = useScriptStore((s) => s.renameFolder);
  const deleteFolder = useScriptStore((s) => s.deleteFolder);
  const createScript = useScriptStore((s) => s.createScript);

  // Register the folder container as a droppable zone so scripts can be
  // dragged into empty folders or onto the folder area itself.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: folder.id,
  });

  const sortedScripts = [...scripts].sort((a, b) => a.order - b.order);
  const scriptIds = sortedScripts.map((s) => s.id);

  // Close context menu on outside click or Escape
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;

    function handleClick(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu, closeContextMenu]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  function handleToggleCollapse() {
    if (!isRenaming) {
      toggleFolderCollapse(folder.id);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleRename() {
    setContextMenu(null);
    setRenameValue(folder.name);
    setIsRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      renameFolder(folder.id, trimmed);
    }
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  }

  function handleNewScript() {
    setContextMenu(null);
    createScript(folder.id, "Untitled");
  }

  function handleDelete() {
    setContextMenu(null);
    setShowDeleteConfirm(true);
  }

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteFolder(folder.id);
    } catch (error) {
      console.error(`Failed to delete folder "${folder.name}":`, error);
    }
  }, [deleteFolder, folder.id, folder.name]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  return (
    <div className="mb-1">
      {/* Folder header */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggleCollapse}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleCollapse();
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-white/5 rounded-md transition-colors"
      >
        {/* Collapse/expand chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-white/50 shrink-0 transition-transform ${
            folder.isCollapsed ? "" : "rotate-90"
          }`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-xs text-white/70 uppercase tracking-wider outline-none focus:border-white/40"
          />
        ) : (
          <span className="text-xs text-white/70 uppercase tracking-wider font-medium truncate">
            {folder.name}
          </span>
        )}
      </div>

      {/* Script list (shown when not collapsed) */}
      {!folder.isCollapsed && (
        <div
          ref={setDroppableRef}
          className={`pl-2 min-h-[8px] rounded transition-colors ${
            isOver ? "bg-white/5" : ""
          }`}
        >
          <SortableContext
            items={scriptIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedScripts.map((script) => (
              <ScriptItem
                key={script.id}
                id={script.id}
                title={script.title}
                preview={script.preview || "No content"}
                isActive={activeScriptId === script.id}
              />
            ))}
          </SortableContext>

          {sortedScripts.length === 0 && (
            <div className="px-3 py-2 text-xs text-white/25 italic">
              No scripts
            </div>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[120px] rounded-md bg-neutral-900 border border-white/15 shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={handleNewScript}
            className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
          >
            New Script
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            onClick={handleRename}
            className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400/80 hover:bg-white/10 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        message={`Delete folder "${folder.name}" and all its scripts?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
