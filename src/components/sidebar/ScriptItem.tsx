// ABOUTME: Individual script entry in the sidebar with title, preview, drag handle,
// ABOUTME: and right-click context menu for delete. Title is derived from editor content.

import { useState, useRef, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useScriptStore } from "../../stores/scriptStore";
import { ConfirmDialog } from "../shared/ConfirmDialog";

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
 * - Drag-and-drop reordering via a dedicated drag handle (grip icon)
 * - Click to select as active script
 * - Right-click context menu with Delete action
 *
 * The drag handle pattern (setActivatorNodeRef + listeners on the grip only)
 * ensures click and right-click events on the row body pass through normally
 * without dnd-kit intercepting them.
 */
export function ScriptItem({ id, title, preview, isActive }: ScriptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const setActiveScript = useScriptStore((s) => s.setActiveScript);
  const deleteScript = useScriptStore((s) => s.deleteScript);
  const isDirty = useScriptStore((s) => s.isDirty);

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

  function handleClick() {
    setActiveScript(id);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleDelete() {
    setContextMenu(null);
    setShowDeleteConfirm(true);
  }

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteScript(id);
    } catch (error) {
      console.error(`Failed to delete script "${title}":`, error);
    }
  }, [deleteScript, id, title]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`group relative pl-5 pr-3 py-2 cursor-pointer rounded-md transition-colors ${
          isActive ? "bg-white/10" : "hover:bg-white/5"
        }`}
      >
        {/* Drag handle — only this element receives dnd-kit listeners */}
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-0.5 opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing transition-opacity"
          aria-label="Drag to reorder"
        >
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="currentColor"
            className="text-white/50"
          >
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="6" cy="2" r="1.5" />
            <circle cx="2" cy="7" r="1.5" />
            <circle cx="6" cy="7" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-white/90 font-medium truncate">
            {title}
          </span>
          {isActive && isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
          )}
        </div>
        <div className="text-xs text-white/40 truncate mt-0.5">{preview}</div>
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-30 rounded-md bg-neutral-900 border border-white/15 shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
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
        message={`Delete "${title}"?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
