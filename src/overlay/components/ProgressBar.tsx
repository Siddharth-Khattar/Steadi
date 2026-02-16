// ABOUTME: Thin progress bar at the bottom edge of the teleprompter overlay.
// ABOUTME: Fills left-to-right as the script scrolls, indicating reading progress.

import { useTeleprompterStore } from "../../stores/teleprompterStore";

/**
 * A subtle 4px-tall emerald bar at the absolute bottom of the overlay that
 * fills from left to right as the script progresses (0 to 1). Renders
 * nothing when progress is 0 to avoid a zero-width bar flash.
 *
 * Self-subscribes to scrollProgress from the store so the parent component
 * does not re-render on every progress update (~5x/sec during scrolling).
 */
export function ProgressBar() {
  const progress = useTeleprompterStore((s) => s.scrollProgress);

  if (progress <= 0) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-[4px] z-20">
      <div
        className="h-full bg-emerald-400 rounded-r-full shadow-[0_0_6px_rgba(52,211,153,0.5)]"
        style={{
          width: `${Math.min(progress, 1) * 100}%`,
          transition: "width 200ms linear",
        }}
      />
    </div>
  );
}
