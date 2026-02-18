// ABOUTME: Top toolbar with sidebar/preview toggles and teleprompter launch controls.
// ABOUTME: Serves as the window title bar drag region for repositioning the main window.

import { useEffect, useMemo, useState } from "react";
import { emitTo } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useUIStore } from "../../stores/uiStore";
import { useScriptStore } from "../../stores/scriptStore";

/** Computes a human-readable relative-time string that auto-updates on an interval. */
function useRelativeTime(isoTimestamp: string | null): string | null {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!isoTimestamp) {
      setText(null);
      return;
    }

    const update = () => {
      const diffSec = Math.floor(
        (Date.now() - new Date(isoTimestamp).getTime()) / 1000,
      );

      if (diffSec < 5) setText("just now");
      else if (diffSec < 60) setText(`${diffSec}s ago`);
      else if (diffSec < 3600) setText(`${Math.floor(diffSec / 60)}m ago`);
      else setText(`${Math.floor(diffSec / 3600)}h ago`);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [isoTimestamp]);

  return text;
}

/** Subtle save-state indicator: shows "Saving\u2026", "Saved", or relative last-save time. */
function SaveStatusIndicator() {
  const saveStatus = useScriptStore((s) => s.saveStatus);
  const lastSavedAt = useScriptStore((s) => s.lastSavedAt);
  const activeScriptId = useScriptStore((s) => s.activeScriptId);
  const relativeTime = useRelativeTime(
    saveStatus === "idle" ? lastSavedAt : null,
  );

  if (!activeScriptId) return null;

  if (saveStatus === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-white/40 animate-pulse">
        Saving\u2026
      </span>
    );
  }

  if (saveStatus === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400/60 transition-opacity">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Saved
      </span>
    );
  }

  if (relativeTime) {
    return <span className="text-xs text-white/20">Saved {relativeTime}</span>;
  }

  return null;
}

/** Live word count for the active script. Character count displayed on hover. */
function WordCount() {
  const activeContent = useScriptStore((s) => s.activeContent);
  const activeScriptId = useScriptStore((s) => s.activeScriptId);

  const wordCount = useMemo(() => {
    const trimmed = activeContent.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [activeContent]);

  if (!activeScriptId) return null;

  return (
    <span
      className="text-xs text-white/20 tabular-nums"
      title={`${activeContent.length.toLocaleString()} characters`}
    >
      {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
    </span>
  );
}

/**
 * Top toolbar for the main editor window. Provides:
 * - Left: sidebar toggle button + save status indicator
 * - Right: word count, preview toggle, Start Teleprompter, Settings (placeholder)
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

  /** Save the active script, send it to the overlay, start countdown, and hide the editor (showing FAB). */
  const startTeleprompter = async () => {
    const {
      activeContent,
      activeScriptId: scriptId,
      saveActiveContent,
    } = useScriptStore.getState();

    if (!activeContent || !scriptId) return;

    try {
      await saveActiveContent();
      await emitTo("overlay", "teleprompter:load-script", {
        content: activeContent,
      });
      await emitTo("overlay", "teleprompter:start-countdown", {});
      await invoke("start_teleprompter_session");
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
      {/* Left side: sidebar toggle + save status */}
      <div className="flex items-center gap-3">
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
        <SaveStatusIndicator />
      </div>

      {/* Right side: word count, preview toggle, teleprompter, settings */}
      <div className="flex items-center gap-3">
        <WordCount />
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
