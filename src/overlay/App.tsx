// ABOUTME: Overlay window root hosting the teleprompter UI with markdown rendering and auto-scroll.
// ABOUTME: Wires scroll engine, event listeners, countdown, progress bar, and reading-line highlight.

import { useRef, useCallback } from "react";
import { useTeleprompterStore, SPEED_VALUES } from "../stores/teleprompterStore";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useOverlayEvents } from "./hooks/useOverlayEvents";
import { useOverlayGeometry } from "./hooks/useOverlayGeometry";
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
  const scrollProgress = useTeleprompterStore((s) => s.scrollProgress);
  const speedPreset = useTeleprompterStore((s) => s.speedPreset);
  const opacity = useTeleprompterStore((s) => s.opacity);
  const decrementCountdown = useTeleprompterStore((s) => s.decrementCountdown);

  const speedPxPerSec = SPEED_VALUES[speedPreset];

  const scrollEngine = useAutoScroll({
    containerRef: scrollContainerRef,
    speedPxPerSec,
    isPlaying,
  });

  const handleRewind = useCallback(() => {
    const current = scrollEngine.getScrollPosition();
    scrollEngine.setScrollPosition(Math.max(0, current - 150));
  }, [scrollEngine]);

  const handleScrollUp = useCallback(() => {
    const current = scrollEngine.getScrollPosition();
    scrollEngine.setScrollPosition(Math.max(0, current - 80));
  }, [scrollEngine]);

  const handleScrollDown = useCallback(() => {
    const current = scrollEngine.getScrollPosition();
    const container = scrollContainerRef.current;
    const maxScroll = container
      ? container.scrollHeight - container.clientHeight
      : Infinity;
    scrollEngine.setScrollPosition(Math.min(maxScroll, current + 80));
  }, [scrollEngine]);

  useOverlayEvents({
    onRewind: handleRewind,
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
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
      <div className="absolute left-0 right-0 top-[30%] h-[2em] bg-white/[0.03] pointer-events-none z-10" />

      {scriptContent ? (
        <>
          <TeleprompterView containerRef={scrollContainerRef} />
          <ProgressBar progress={scrollProgress} />
          {showCountdown && <Countdown onComplete={decrementCountdown} />}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-lg">No script loaded</p>
        </div>
      )}
    </div>
  );
}
