// ABOUTME: Tauri event listeners for inter-window communication in the overlay.
// ABOUTME: Routes incoming events from main window and global shortcuts to teleprompter store actions.

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseOverlayEventsParams {
  onRewind: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

/**
 * Listens for Tauri events emitted from the main window or Rust global
 * shortcut handlers and routes them to the appropriate store actions
 * or callback functions.
 *
 * Registered events:
 * - teleprompter:load-script  -> store.setScriptContent
 * - teleprompter:start-countdown -> store.startCountdown
 * - teleprompter:toggle-play  -> store.togglePlay
 * - teleprompter:cycle-speed  -> store.cycleSpeed
 * - teleprompter:rewind       -> onRewind callback
 * - teleprompter:scroll-up    -> onScrollUp callback
 * - teleprompter:scroll-down  -> onScrollDown callback
 */
export function useOverlayEvents({
  onRewind,
  onScrollUp,
  onScrollDown,
}: UseOverlayEventsParams): void {
  const setScriptContent = useTeleprompterStore((s) => s.setScriptContent);
  const startCountdown = useTeleprompterStore((s) => s.startCountdown);
  const togglePlay = useTeleprompterStore((s) => s.togglePlay);
  const cycleSpeed = useTeleprompterStore((s) => s.cycleSpeed);

  useEffect(() => {
    const listeners = [
      listen<{ content: string }>("teleprompter:load-script", (event) => {
        setScriptContent(event.payload.content);
      }),
      listen("teleprompter:start-countdown", () => {
        startCountdown();
      }),
      listen("teleprompter:toggle-play", () => {
        togglePlay();
      }),
      listen("teleprompter:cycle-speed", () => {
        cycleSpeed();
      }),
      listen("teleprompter:rewind", () => {
        onRewind();
      }),
      listen("teleprompter:scroll-up", () => {
        onScrollUp();
      }),
      listen("teleprompter:scroll-down", () => {
        onScrollDown();
      }),
    ];

    return () => {
      listeners.forEach((p) => p.then((fn) => fn()));
    };
  }, [
    setScriptContent,
    startCountdown,
    togglePlay,
    cycleSpeed,
    onRewind,
    onScrollUp,
    onScrollDown,
  ]);
}
