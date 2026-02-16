// ABOUTME: Tauri event listeners for inter-window communication in the overlay.
// ABOUTME: Routes incoming events from main window and global shortcuts to teleprompter store actions.

import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseOverlayEventsParams {
  onSessionStart: () => void;
  onRewind: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

/**
 * Listens for Tauri events emitted from the main window or Rust global
 * shortcut handlers and routes them to the appropriate store actions
 * or callback functions.
 *
 * Uses getState() for store actions and refs for callback props so that
 * listeners are registered exactly once on mount and never torn down until
 * unmount. This eliminates event-loss gaps caused by listener churn.
 *
 * Registered events:
 * - teleprompter:load-script   -> store.setScriptContent
 * - teleprompter:start-countdown -> store.startCountdown + onSessionStart
 * - teleprompter:toggle-play   -> store.togglePlay
 * - teleprompter:cycle-speed   -> store.cycleSpeed
 * - teleprompter:rewind        -> onRewind callback
 * - teleprompter:scroll-up     -> onScrollUp callback
 * - teleprompter:scroll-down   -> onScrollDown callback
 */
export function useOverlayEvents({
  onSessionStart,
  onRewind,
  onScrollUp,
  onScrollDown,
}: UseOverlayEventsParams): void {
  // Hold callback props in refs so the listener closures always call the
  // latest version without needing to re-register.
  const onSessionStartRef = useRef(onSessionStart);
  const onRewindRef = useRef(onRewind);
  const onScrollUpRef = useRef(onScrollUp);
  const onScrollDownRef = useRef(onScrollDown);

  useEffect(() => {
    onSessionStartRef.current = onSessionStart;
    onRewindRef.current = onRewind;
    onScrollUpRef.current = onScrollUp;
    onScrollDownRef.current = onScrollDown;
  });

  useEffect(() => {
    const listeners = [
      listen<{ content: string }>("teleprompter:load-script", (event) => {
        useTeleprompterStore.getState().setScriptContent(event.payload.content);
      }),
      listen("teleprompter:start-countdown", () => {
        useTeleprompterStore.getState().startCountdown();
        onSessionStartRef.current();
      }),
      listen("teleprompter:toggle-play", () => {
        useTeleprompterStore.getState().togglePlay();
      }),
      listen("teleprompter:cycle-speed", () => {
        useTeleprompterStore.getState().cycleSpeed();
      }),
      listen("teleprompter:rewind", () => {
        onRewindRef.current();
      }),
      listen("teleprompter:scroll-up", () => {
        onScrollUpRef.current();
      }),
      listen("teleprompter:scroll-down", () => {
        onScrollDownRef.current();
      }),
    ];

    return () => {
      listeners.forEach((p) => p.then((fn) => fn()));
    };
  }, []);
}
