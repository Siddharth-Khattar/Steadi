// ABOUTME: Individual script entry in the sidebar with title, preview, drag-and-drop support,
// ABOUTME: and right-click context menu for rename and delete operations.

import { useState, useRef, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useScriptStore } from "../../stores/scriptStore";

interface ScriptItemProps {
  id: string;
  title: string;
  preview: string;
  isActive: boolean;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

/**
 * A single script entry in the sidebar file tree. Supports:
 * - Drag-and-drop reordering via @dnd-kit/sortable
 * - Click to select as active script
 * - Right-click context menu with Rename and Delete actions
 * - Inline title editing for rename
 */
export function ScriptItem({ id, title, preview, isActive }: ScriptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const setActiveScript = useScriptStore((s) => s.setActiveScript);
  const renameScript = useScriptStore((s) => s.renameScript);
  const deleteScript = useScriptStore((s) => s.deleteScript);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  function handleClick() {
    if (!isRenaming) {
      setActiveScript(id);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleRename() {
    setContextMenu(null);
    setRenameValue(title);
    setIsRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      renameScript(id, trimmed);
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
    if (window.confirm(`Delete "${title}"?`)) {
      deleteScript(id);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`px-3 py-2 cursor-pointer rounded-md transition-colors ${
          isActive ? "bg-white/10" : "hover:bg-white/5"
        }`}
      >
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            className="w-full bg-white/10 border border-white/20 rounded px-1 py-0.5 text-sm text-white/90 outline-none focus:border-white/40"
          />
        ) : (
          <div className="text-sm text-white/90 font-medium truncate">
            {title}
          </div>
        )}
        <div className="text-xs text-white/40 truncate mt-0.5">{preview}</div>
      </div>

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
    </>
  );
}
