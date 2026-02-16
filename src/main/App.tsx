// ABOUTME: Main application window. Provides app information and overlay
// ABOUTME: controls for Phase 1 validation spike.

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GlassPanel } from "../components/ui/GlassPanel";

const isMac = /Mac/.test(navigator.userAgent);
const SHORTCUT_LABEL = isMac ? "Cmd+Shift+S" : "Ctrl+Shift+S";

export default function MainApp() {
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);

  async function handleToggleOverlay() {
    const newState = await invoke<boolean>("toggle_overlay");
    setOverlayVisible(newState);
  }

  return (
    <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-8">
      <GlassPanel className="max-w-md w-full p-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Steadi
          </h1>
          <p className="text-white/60 text-sm mt-1">Invisible Teleprompter</p>
        </div>

        <div className="w-full h-px bg-white/10" />

        <div className="text-center space-y-3">
          <p className="text-white/70 text-sm">
            Press{" "}
            <kbd className="px-2 py-0.5 rounded bg-white/10 text-white/90 text-xs font-mono">
              {SHORTCUT_LABEL}
            </kbd>{" "}
            to toggle overlay
          </p>

          <button
            type="button"
            onClick={handleToggleOverlay}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Toggle Overlay
          </button>

          <p className="text-white/40 text-xs">
            Overlay:{" "}
            <span className={overlayVisible ? "text-green-400/80" : "text-white/50"}>
              {overlayVisible ? "visible" : "hidden"}
            </span>
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
