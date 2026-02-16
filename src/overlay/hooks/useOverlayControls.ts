// ABOUTME: Local keyboard controls, hover-to-pause, and speed indicator for the overlay window.
// ABOUTME: Handles Space, Escape, brackets, minus/equal keys and mouseenter/mouseleave.

import { useEffect, useRef, useState } from "react";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseOverlayControlsParams {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

interface UseOverlayControlsReturn {
  speedIndicator: string | null;
}

/**
 * Provides local keyboard shortcuts, hover-to-pause behavior, and speed
 * indicator toast within the overlay window.
 *
 * All store actions are accessed via getState() inside handlers so the effect
 * dependencies are empty — listeners are registered once on mount and never
 * torn down until unmount.
 *
 * Local keys:
 *   Space        -> toggle play/pause
 *   Escape       -> stop teleprompter (reset + clear script)
 *   BracketLeft  -> decrease font size
 *   BracketRight -> increase font size
 *   Minus        -> decrease opacity
 *   Equal        -> increase opacity
 *
 * Hover-to-pause: mouseenter on content area pauses scrolling; mouseleave
 * resumes only if the pause was caused by hovering (not manual pause).
 *
 * Speed indicator: watches speedPreset changes and briefly shows the preset
 * name, clearing after 1.5 seconds.
 */
export function useOverlayControls({
  contentRef,
}: UseOverlayControlsParams): UseOverlayControlsReturn {
  const speedPreset = useTeleprompterStore((s) => s.speedPreset);

  // Hover-to-pause flag: true when scrolling was paused by a mouseenter event
  const pausedByHoverRef = useRef(false);

  // Speed indicator toast state
  const [speedIndicator, setSpeedIndicator] = useState<string | null>(null);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether this is the initial mount (skip indicator on first render)
  const isInitialMountRef = useRef(true);

  // ---- Local keyboard shortcuts ----
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const store = useTeleprompterStore.getState();

      switch (e.code) {
        case "Space":
          e.preventDefault();
          store.togglePlay();
          break;
        case "Escape":
          e.preventDefault();
          store.resetTeleprompter();
          store.setScriptContent("");
          break;
        case "BracketLeft":
          e.preventDefault();
          store.decreaseFontSize();
          break;
        case "BracketRight":
          e.preventDefault();
          store.increaseFontSize();
          break;
        case "Minus":
          e.preventDefault();
          store.decreaseOpacity();
          break;
        case "Equal":
          e.preventDefault();
          store.increaseOpacity();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---- Hover-to-pause logic ----
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function handleMouseEnter() {
      const { isPlaying } = useTeleprompterStore.getState();
      if (isPlaying) {
        pausedByHoverRef.current = true;
        useTeleprompterStore.getState().setPlaying(false);
      }
    }

    function handleMouseLeave() {
      if (pausedByHoverRef.current) {
        pausedByHoverRef.current = false;
        useTeleprompterStore.getState().setPlaying(true);
      }
    }

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [contentRef]);

  // ---- Speed indicator toast ----
  useEffect(() => {
    // Skip indicator on initial mount (app just loaded, not a user-initiated change)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const label = speedPreset.charAt(0).toUpperCase() + speedPreset.slice(1);
    setSpeedIndicator(label);

    if (indicatorTimerRef.current !== null) {
      clearTimeout(indicatorTimerRef.current);
    }
    indicatorTimerRef.current = setTimeout(() => {
      setSpeedIndicator(null);
      indicatorTimerRef.current = null;
    }, 1500);

    return () => {
      if (indicatorTimerRef.current !== null) {
        clearTimeout(indicatorTimerRef.current);
      }
    };
  }, [speedPreset]);

  return { speedIndicator };
}
