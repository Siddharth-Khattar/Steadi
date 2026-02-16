// ABOUTME: Overlay window root hosting the teleprompter UI with markdown rendering and auto-scroll.
// ABOUTME: Wires scroll engine, event listeners, keyboard controls, hover-to-pause, and visual polish.

import { useRef, useCallback } from "react";
import {
  useTeleprompterStore,
  SPEED_VALUES,
} from "../stores/teleprompterStore";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useOverlayEvents } from "./hooks/useOverlayEvents";
import { useOverlayGeometry } from "./hooks/useOverlayGeometry";
import { useOverlayControls } from "./hooks/useOverlayControls";
import { TeleprompterView } from "./components/TeleprompterView";
import { Countdown } from "./components/Countdown";
import { ProgressBar } from "./components/ProgressBar";
import { WindowControls } from "./components/WindowControls";

/**
 * The overlay window is transparent (set in index.html). The dark background
 * comes from CSS. Bottom corners are rounded; top edge aligns with the
 * window's position (below menu bar on macOS).
 */
export default function OverlayApp() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isPlaying = useTeleprompterStore((s) => s.isPlaying);
  const showCountdown = useTeleprompterStore((s) => s.showCountdown);
  const scriptContent = useTeleprompterStore((s) => s.scriptContent);
  const speedPreset = useTeleprompterStore((s) => s.speedPreset);
  const opacity = useTeleprompterStore((s) => s.opacity);

  const speedPxPerSec = SPEED_VALUES[speedPreset];

  // Destructure into individual stable refs — the object literal from
  // useAutoScroll is new each render, but the useCallback functions inside
  // are referentially stable across renders.
  const { setScrollPosition, getScrollPosition } = useAutoScroll({
    containerRef: scrollContainerRef,
    speedPxPerSec,
    isPlaying,
  });

  // Pixel-based rewind: scrolls back ~1/3 of the visible viewport height.
  // Reliable regardless of markdown formatting / variable line heights.
  const handleRewind = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const rewindDistance = container.clientHeight * 0.33;
    setScrollPosition(Math.max(0, getScrollPosition() - rewindDistance));
  }, [getScrollPosition, setScrollPosition]);

  const handleScrollUp = useCallback(() => {
    const current = getScrollPosition();
    setScrollPosition(Math.max(0, current - 80));
  }, [getScrollPosition, setScrollPosition]);

  const handleScrollDown = useCallback(() => {
    const current = getScrollPosition();
    const container = scrollContainerRef.current;
    const maxScroll = container
      ? container.scrollHeight - container.clientHeight
      : Infinity;
    setScrollPosition(Math.min(maxScroll, current + 80));
  }, [getScrollPosition, setScrollPosition]);

  useOverlayEvents({
    onRewind: handleRewind,
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
  });

  const { speedIndicator } = useOverlayControls({
    contentRef: scrollContainerRef,
  });

  useOverlayGeometry();

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden bg-black relative"
      style={{ opacity }}
    >
      {/* Invisible edge/corner resize zones and top drag strip */}
      <WindowControls />

      {/* Reading line highlight guide */}
      <div className="absolute left-0 right-0 top-[30%] h-[2em] bg-white/3 pointer-events-none z-10" />

      {/* Speed indicator toast */}
      {speedIndicator && (
        <div className="absolute top-4 right-4 bg-white/10 text-white/80 text-sm px-3 py-1 rounded-full z-40 pointer-events-none">
          {speedIndicator}
        </div>
      )}

      {scriptContent ? (
        <>
          <TeleprompterView containerRef={scrollContainerRef} />
          <ProgressBar />
          {showCountdown && <Countdown />}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-lg">No script loaded</p>
        </div>
      )}
    </div>
  );
}
