// ABOUTME: Local keyboard controls, hover-to-pause, speed indicator, and keymap guide for the overlay.
// ABOUTME: Handles Space, Escape, brackets, minus/equal, "?" keys and mouseenter/mouseleave.

import { useEffect, useRef, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseOverlayControlsParams {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

interface UseOverlayControlsReturn {
  speedIndicator: string | null;
  showKeymapGuide: boolean;
  dismissKeymapGuide: () => void;
}

/**
 * Provides local keyboard shortcuts, hover-to-pause behavior, speed indicator
 * toast, and keymap guide toggle within the overlay window.
 *
 * All store actions are accessed via getState() inside handlers so the effect
 * dependencies are minimal — listeners are registered once (or only when the
 * guide visibility changes) and never torn down otherwise.
 *
 * Local keys:
 *   Space        -> toggle play/pause
 *   Escape       -> stop teleprompter (reset + clear script)
 *   Cmd/Ctrl + - -> decrease font size
 *   Cmd/Ctrl + + -> increase font size
 *   Minus        -> decrease opacity
 *   Equal/+      -> increase opacity
 *   ?            -> toggle keyboard shortcut guide
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

  // Keymap guide visibility state
  const [showKeymapGuide, setShowKeymapGuide] = useState(false);
  const keymapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to read guide visibility inside handlers without adding it as
  // a dependency that causes listener re-registration.
  const showKeymapGuideRef = useRef(false);
  useEffect(() => {
    showKeymapGuideRef.current = showKeymapGuide;
  });

  const dismissKeymapGuide = useCallback(() => {
    setShowKeymapGuide(false);
    if (keymapTimerRef.current !== null) {
      clearTimeout(keymapTimerRef.current);
      keymapTimerRef.current = null;
    }
  }, []);

  // ---- Local keyboard shortcuts ----
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check for "?" before the e.code switch — the "?" character is
      // produced by different physical keys depending on the keyboard layout.
      if (e.key === "?") {
        e.preventDefault();
        if (showKeymapGuideRef.current) {
          // Currently showing → dismiss
          setShowKeymapGuide(false);
          if (keymapTimerRef.current !== null) {
            clearTimeout(keymapTimerRef.current);
            keymapTimerRef.current = null;
          }
        } else {
          // Show guide with auto-dismiss after 6 seconds
          setShowKeymapGuide(true);
          // Clear any lingering timer from a previous rapid toggle
          if (keymapTimerRef.current !== null) {
            clearTimeout(keymapTimerRef.current);
          }
          keymapTimerRef.current = setTimeout(() => {
            setShowKeymapGuide(false);
            keymapTimerRef.current = null;
          }, 6000);
        }
        return;
      }

      // If keymap guide is visible, any non-"?" key dismisses it
      if (showKeymapGuideRef.current) {
        setShowKeymapGuide(false);
        if (keymapTimerRef.current !== null) {
          clearTimeout(keymapTimerRef.current);
          keymapTimerRef.current = null;
        }
        // Don't process the key further — just dismiss the guide
        return;
      }

      const store = useTeleprompterStore.getState();
      const hasModifier = e.metaKey || e.ctrlKey;

      // Layout-aware font size (Cmd/Ctrl + key) and opacity (plain key) controls.
      // Uses e.key instead of e.code so it works across keyboard layouts (e.g. German).
      if (e.key === "-") {
        e.preventDefault();
        if (hasModifier) {
          store.decreaseFontSize();
        } else {
          store.decreaseOpacity();
        }
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        if (hasModifier) {
          store.increaseFontSize();
        } else {
          store.increaseOpacity();
        }
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          store.togglePlay();
          break;
        case "Escape":
          e.preventDefault();
          store.resetTeleprompter();
          store.setScriptContent("");
          // Restore the editor window and hide the FAB
          void invoke("restore_editor");
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

  // Cleanup auto-dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (keymapTimerRef.current !== null) {
        clearTimeout(keymapTimerRef.current);
      }
    };
  }, []);

  return { speedIndicator, showKeymapGuide, dismissKeymapGuide };
}
