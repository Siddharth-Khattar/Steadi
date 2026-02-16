// ABOUTME: Full-screen countdown overlay showing 3, 2, 1 before teleprompter scrolling begins.
// ABOUTME: Reads countdown state from the store and decrements each second until scrolling starts.

import { useEffect } from "react";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

/**
 * Displays a 3-2-1 countdown as a large centered number overlaying the
 * teleprompter content. The script text remains visible but dimmed underneath.
 *
 * Reads countdownValue directly from the store and calls decrementCountdown
 * each second. The store handles the transition to isPlaying when the count
 * reaches 0, which also sets showCountdown=false (causing this to unmount).
 */
export function Countdown() {
  const countdownValue = useTeleprompterStore((s) => s.countdownValue);
  const decrementCountdown = useTeleprompterStore((s) => s.decrementCountdown);

  useEffect(() => {
    if (countdownValue <= 0) return;
    const timer = setTimeout(() => {
      decrementCountdown();
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdownValue, decrementCountdown]);

  if (countdownValue <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40">
      <span
        className="text-white/90 text-8xl font-bold tabular-nums transition-transform duration-200 scale-100"
        key={countdownValue}
      >
        {countdownValue}
      </span>
    </div>
  );
}
