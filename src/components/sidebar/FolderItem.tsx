// ABOUTME: Collapsible folder component in the sidebar file tree containing sortable script items.
// ABOUTME: Supports expand/collapse, right-click context menu for rename/delete, and drag-and-drop reordering.

import { useState, useRef, useEffect, useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Folder, ScriptMeta } from "../../persistence/types";
import { useScriptStore } from "../../stores/scriptStore";
import { ScriptItem } from "./ScriptItem";

interface FolderItemProps {
  folder: Folder;
  scripts: ScriptMeta[];
  activeScriptId: string | null;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

/** Strip markdown syntax for a clean preview snippet. */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/__(.+?)__/g, "$1") // bold (underscore)
    .replace(/_(.+?)_/g, "$1") // italic (underscore)
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "") // images
    .replace(/^[-*+]\s+/gm, "") // list markers
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/^>\s+/gm, "") // blockquotes
    .trim();
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const toggleFolderCollapse = useScriptStore((s) => s.toggleFolderCollapse);
  const renameFolder = useScriptStore((s) => s.renameFolder);
  const deleteFolder = useScriptStore((s) => s.deleteFolder);

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

  function handleDelete() {
    setContextMenu(null);
    if (
      window.confirm(
        `Delete folder "${folder.name}" and all its scripts?`,
      )
    ) {
      deleteFolder(folder.id);
    }
  }

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
        <div className="pl-2">
          <SortableContext
            items={scriptIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedScripts.map((script) => (
              <ScriptItem
                key={script.id}
                id={script.id}
                title={script.title}
                preview={stripMarkdown(script.title).slice(0, 80) || "No content"}
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
    </div>
  );
}

// Re-export the stripMarkdown utility for use in the Sidebar parent
export { stripMarkdown };
