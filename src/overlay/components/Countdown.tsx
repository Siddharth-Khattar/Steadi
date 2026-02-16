// ABOUTME: Full-screen countdown overlay showing 3, 2, 1 before teleprompter scrolling begins.
// ABOUTME: Overlays on top of dimmed script content, calls onComplete when countdown finishes.

import { useState, useEffect } from "react";

interface CountdownProps {
  onComplete: () => void;
}

/**
 * Displays a 3-2-1 countdown as a large centered number overlaying the
 * teleprompter content. The script text remains visible but dimmed underneath.
 * When the count reaches 0, calls onComplete and renders nothing.
 */
export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40">
      <span
        className="text-white/90 text-8xl font-bold tabular-nums transition-transform duration-200 scale-100"
        key={count}
      >
        {count}
      </span>
    </div>
  );
}
