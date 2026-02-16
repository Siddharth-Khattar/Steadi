// ABOUTME: Floating action button that restores the editor window when clicked.
// ABOUTME: Rendered as a small circular button with a pencil icon, always on top.

import { invoke } from "@tauri-apps/api/core";

/**
 * A small circular FAB (floating action button) that appears when the
 * teleprompter session is active and the editor is hidden. Clicking it
 * invokes the `restore_editor` command to bring back the main window.
 */
export function EditorFabApp() {
  const handleClick = async () => {
    try {
      await invoke("restore_editor");
    } catch (err) {
      console.error("Failed to restore editor:", err);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        title="Return to editor"
        aria-label="Return to editor"
        className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-white/15 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
      >
        {/* Pencil / edit icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/90"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
    </div>
  );
}
