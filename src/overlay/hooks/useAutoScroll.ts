// ABOUTME: requestAnimationFrame-based continuous scroll engine for the teleprompter.
// ABOUTME: Drives smooth upward scrolling with time-delta position updates, throttled progress reporting.

import { useEffect, useRef, useCallback } from "react";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface UseAutoScrollParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  speedPxPerSec: number;
  isPlaying: boolean;
}

interface UseAutoScrollReturn {
  scrollProgress: number;
  setScrollPosition: (pos: number) => void;
  getScrollPosition: () => number;
}

/**
 * Drives smooth continuous scrolling using requestAnimationFrame.
 *
 * - Uses performance.now() time-delta to compute distance per frame,
 *   ensuring consistent speed across 60Hz and 120Hz displays.
 * - Scroll position is stored in a ref (not state) to avoid 60 re-renders/sec.
 * - container.scrollTop is set directly for performance.
 * - Progress (0-1) is reported to the teleprompter store throttled (~200ms).
 * - Stops silently at end of script (no loop, no auto-close).
 */
export function useAutoScroll({
  containerRef,
  speedPxPerSec,
  isPlaying,
}: UseAutoScrollParams): UseAutoScrollReturn {
  const scrollPosRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafIdRef = useRef(0);
  const lastProgressUpdateRef = useRef(0);
  const progressRef = useRef(0);

  const setScrollProgress = useTeleprompterStore(
    (s) => s.setScrollProgress,
  );

  const setScrollPosition = useCallback(
    (pos: number) => {
      scrollPosRef.current = pos;
      const container = containerRef.current;
      if (container) {
        container.scrollTop = pos;

        // Update progress immediately on manual position change
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          progressRef.current = pos / maxScroll;
          setScrollProgress(progressRef.current);
        }
      }
    },
    [containerRef, setScrollProgress],
  );

  const getScrollPosition = useCallback(() => {
    return scrollPosRef.current;
  }, []);

  useEffect(() => {
    if (!isPlaying || !containerRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      return;
    }

    const container = containerRef.current;
    // Reset lastTime to avoid a time-delta jump when resuming
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      scrollPosRef.current += speedPxPerSec * delta;

      // Clamp to max scroll
      const maxScroll = container.scrollHeight - container.clientHeight;
      scrollPosRef.current = Math.min(scrollPosRef.current, maxScroll);

      container.scrollTop = scrollPosRef.current;

      // Throttled progress update (~200ms)
      if (now - lastProgressUpdateRef.current >= 200) {
        lastProgressUpdateRef.current = now;
        if (maxScroll > 0) {
          progressRef.current = scrollPosRef.current / maxScroll;
          setScrollProgress(progressRef.current);
        }
      }

      // Continue scrolling if not at the end
      if (scrollPosRef.current < maxScroll) {
        rafIdRef.current = requestAnimationFrame(step);
      }
      // else: end of script, stop silently
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, speedPxPerSec, containerRef, setScrollProgress]);

  return {
    scrollProgress: progressRef.current,
    setScrollPosition,
    getScrollPosition,
  };
}
