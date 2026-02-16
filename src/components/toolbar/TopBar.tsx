// ABOUTME: Top toolbar with sidebar/preview toggles and teleprompter launch controls.
// ABOUTME: Serves as the window title bar drag region for repositioning the main window.

import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "../../stores/uiStore";
import { useScriptStore } from "../../stores/scriptStore";

/**
 * Top toolbar for the main editor window. Provides:
 * - Left: sidebar toggle button
 * - Right: preview toggle, Start Teleprompter, Settings (placeholder)
 *
 * The entire bar acts as a Tauri drag region so users can reposition
 * the window by dragging the toolbar.
 */
export function TopBar() {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const previewVisible = useUIStore((s) => s.previewVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const togglePreview = useUIStore((s) => s.togglePreview);
  const activeScriptId = useScriptStore((s) => s.activeScriptId);

  /** Save the active script, send it to the overlay, start countdown, and minimize the editor. */
  const startTeleprompter = async () => {
    const { activeContent, activeScriptId: scriptId, saveActiveContent } =
      useScriptStore.getState();

    if (!activeContent || !scriptId) return;

    try {
      await saveActiveContent();
      await emitTo("overlay", "teleprompter:load-script", {
        content: activeContent,
      });
      await emitTo("overlay", "teleprompter:start-countdown", {});
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error("Failed to start teleprompter:", err);
    }
  };

  const canStart = activeScriptId !== null;

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-11 px-4 border-b border-white/10 shrink-0 select-none"
    >
      {/* Left side: sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            sidebarVisible
              ? "text-white/90 bg-white/10"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          {/* Simple panel/hamburger icon using SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block"
          >
            <rect
              x="1"
              y="2"
              width="14"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line
              x1="5.5"
              y1="2"
              x2="5.5"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>

      {/* Right side: preview toggle, teleprompter, settings */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePreview}
          title={previewVisible ? "Hide preview" : "Show preview"}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            previewVisible
              ? "text-white/90 bg-white/10"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Preview
        </button>

        <button
          type="button"
          disabled={!canStart}
          onClick={startTeleprompter}
          title={canStart ? "Start teleprompter" : "Open a script first"}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            canStart
              ? "text-white/90 bg-white/10 hover:bg-white/15 cursor-pointer"
              : "text-white/30 cursor-not-allowed"
          }`}
        >
          Start
        </button>

        <button
          type="button"
          disabled
          title="Coming in a future update"
          className="px-2.5 py-1 rounded text-xs font-medium text-white/30 cursor-not-allowed"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
