// ABOUTME: Root sidebar component providing drag-and-drop context and folder/script tree.
// ABOUTME: Wraps all folders in a DndContext for cross-folder script drag-and-drop reordering.

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useScriptStore } from "../../stores/scriptStore";
import { SidebarToolbar } from "./SidebarToolbar";
import { FolderItem } from "./FolderItem";
import { ScriptItem } from "./ScriptItem";

/**
 * Root sidebar component. Renders:
 * 1. A toolbar at the top for creating scripts/folders
 * 2. A scrollable list of collapsible folders, each containing sortable scripts
 *
 * The entire tree is wrapped in a DndContext to enable reordering within
 * folders and dragging scripts between folders.
 */
export function Sidebar() {
  const folders = useScriptStore((s) => s.folders);
  const scripts = useScriptStore((s) => s.scripts);
  const activeScriptId = useScriptStore((s) => s.activeScriptId);
  const reorderScripts = useScriptStore((s) => s.reorderScripts);
  const moveScript = useScriptStore((s) => s.moveScript);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Require 8px of pointer movement before initiating a drag, allowing
  // click and right-click events to pass through to ScriptItem handlers.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor);

  const sortedFolders = [...folders].sort((a, b) => a.order - b.order);

  // Set of folder IDs for quick lookup when resolving drop targets
  const folderIdSet = useMemo(
    () => new Set(folders.map((f) => f.id)),
    [folders],
  );

  /** Get the folder that contains a given script. */
  const findFolderForScript = useCallback(
    (scriptId: string): string | null => {
      const script = scripts.find((s) => s.id === scriptId);
      return script ? script.folderId : null;
    },
    [scripts],
  );

  /**
   * Resolve the target folder for a drop event. The `over.id` may be either:
   * - A folder ID (from useDroppable on the folder container)
   * - A script ID (from useSortable on a script item)
   */
  const resolveTargetFolder = useCallback(
    (overId: string): string | null => {
      if (folderIdSet.has(overId)) return overId;
      return findFolderForScript(overId);
    },
    [folderIdSet, findFolderForScript],
  );

  /** Get sorted scripts for a folder. */
  const getScriptsForFolder = useCallback(
    (folderId: string) => {
      return scripts
        .filter((s) => s.folderId === folderId)
        .sort((a, b) => a.order - b.order);
    },
    [scripts],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeFolderId = findFolderForScript(activeId);
    const targetFolderId = resolveTargetFolder(overId);

    // Move script to a different folder when dragged over it
    if (
      activeFolderId &&
      targetFolderId &&
      activeFolderId !== targetFolderId
    ) {
      moveScript(activeId, targetFolderId);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a folder container, the cross-folder move was already
    // handled in handleDragOver — nothing more to do.
    if (folderIdSet.has(overId)) return;

    const activeFolderId = findFolderForScript(activeId);
    const overFolderId = findFolderForScript(overId);

    // Same folder reorder
    if (activeFolderId && activeFolderId === overFolderId) {
      const folderScripts = getScriptsForFolder(activeFolderId);
      const scriptIds = folderScripts.map((s) => s.id);

      const oldIndex = scriptIds.indexOf(activeId);
      const newIndex = scriptIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(scriptIds, oldIndex, newIndex);
        reorderScripts(activeFolderId, reordered);
      }
    }
  }

  // Find the actively dragged script for the overlay
  const draggedScript = activeDragId
    ? scripts.find((s) => s.id === activeDragId)
    : null;

  return (
    <div className="flex flex-col h-full bg-white/5 border-r border-white/10">
      <SidebarToolbar />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto py-1">
          {sortedFolders.length > 0 ? (
            sortedFolders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                scripts={getScriptsForFolder(folder.id)}
                activeScriptId={activeScriptId}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <p className="text-xs text-white/30">
                Click + to create your first script
              </p>
            </div>
          )}
        </div>

        <DragOverlay>
          {draggedScript ? (
            <div className="opacity-80 bg-white/10 rounded-md shadow-lg">
              <ScriptItem
                id={draggedScript.id}
                title={draggedScript.title}
                preview={draggedScript.preview || "No content"}
                isActive={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
