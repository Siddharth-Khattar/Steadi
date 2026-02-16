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

  // ---- Sentence-level rewind using Intl.Segmenter ----
  const rewindToSentence = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const content = useTeleprompterStore.getState().scriptContent;
    if (!content) return;

    const currentPos = scrollEngine.getScrollPosition();
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (maxScroll <= 0) return;

    // Estimate which character offset the current scroll position maps to
    const totalChars = content.length;
    const approxCharOffset = (currentPos / maxScroll) * totalChars;

    // Use Intl.Segmenter to split into sentences
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "sentence",
    });
    const segments = Array.from(segmenter.segment(content));

    // Find the sentence boundary just before the current position
    let targetCharOffset = 0;
    for (const segment of segments) {
      const sentenceEnd = segment.index + segment.segment.length;
      if (sentenceEnd >= approxCharOffset) {
        // Current sentence found -- rewind to the start of the previous sentence
        targetCharOffset = Math.max(0, segment.index - 1);
        // Find the actual start of the previous sentence
        for (let i = segments.indexOf(segment) - 1; i >= 0; i--) {
          targetCharOffset = segments[i].index;
          break;
        }
        break;
      }
      targetCharOffset = segment.index;
    }

    // Convert character offset back to scroll position
    const targetScrollPos = (targetCharOffset / totalChars) * maxScroll;
    scrollEngine.setScrollPosition(Math.max(0, targetScrollPos));
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
    onRewind: rewindToSentence,
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
  });

  const { speedIndicator } = useOverlayControls({
    contentRef: scrollContainerRef,
    onRewind: rewindToSentence,
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
