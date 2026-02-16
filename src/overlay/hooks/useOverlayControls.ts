// ABOUTME: Local keyboard controls and hover-to-pause logic for the overlay window.
// ABOUTME: Handles Space, Escape, brackets, minus/equal keys and mouseenter/mouseleave on the scroll container.

import { useEffect, useRef, useState } from "react";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseOverlayControlsParams {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onRewind: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

interface UseOverlayControlsReturn {
  speedIndicator: string | null;
}

/**
 * Provides local keyboard shortcuts and hover-to-pause behavior within the
 * overlay window. Keyboard bindings are active when the overlay has focus.
 *
 * Local keys:
 *   Space       -> toggle play/pause
 *   Escape      -> stop teleprompter (reset + clear script)
 *   BracketLeft -> decrease font size
 *   BracketRight-> increase font size
 *   Minus       -> decrease opacity
 *   Equal       -> increase opacity
 *
 * Hover-to-pause: mouseenter on content area pauses scrolling; mouseleave
 * resumes only if the pause was caused by hovering (not manual pause).
 *
 * Speed indicator: watches speedPreset changes and briefly shows the preset
 * name, clearing after 1.5 seconds.
 */
export function useOverlayControls({
  contentRef,
  onRewind,
  onScrollUp,
  onScrollDown,
}: UseOverlayControlsParams): UseOverlayControlsReturn {
  const togglePlay = useTeleprompterStore((s) => s.togglePlay);
  const setPlaying = useTeleprompterStore((s) => s.setPlaying);
  const resetTeleprompter = useTeleprompterStore((s) => s.resetTeleprompter);
  const setScriptContent = useTeleprompterStore((s) => s.setScriptContent);
  const increaseFontSize = useTeleprompterStore((s) => s.increaseFontSize);
  const decreaseFontSize = useTeleprompterStore((s) => s.decreaseFontSize);
  const increaseOpacity = useTeleprompterStore((s) => s.increaseOpacity);
  const decreaseOpacity = useTeleprompterStore((s) => s.decreaseOpacity);
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
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "Escape":
          e.preventDefault();
          resetTeleprompter();
          setScriptContent("");
          break;
        case "BracketLeft":
          e.preventDefault();
          decreaseFontSize();
          break;
        case "BracketRight":
          e.preventDefault();
          increaseFontSize();
          break;
        case "Minus":
          e.preventDefault();
          decreaseOpacity();
          break;
        case "Equal":
          e.preventDefault();
          increaseOpacity();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    resetTeleprompter,
    setScriptContent,
    increaseFontSize,
    decreaseFontSize,
    increaseOpacity,
    decreaseOpacity,
    onRewind,
    onScrollUp,
    onScrollDown,
  ]);

  // ---- Hover-to-pause logic ----
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function handleMouseEnter() {
      const isPlaying = useTeleprompterStore.getState().isPlaying;
      if (isPlaying) {
        pausedByHoverRef.current = true;
        setPlaying(false);
      }
    }

    function handleMouseLeave() {
      if (pausedByHoverRef.current) {
        pausedByHoverRef.current = false;
        setPlaying(true);
      }
    }

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [contentRef, setPlaying]);

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
