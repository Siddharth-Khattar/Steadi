// ABOUTME: Thin progress bar at the bottom edge of the teleprompter overlay.
// ABOUTME: Fills left-to-right as the script scrolls, indicating reading progress.

interface ProgressBarProps {
  progress: number;
}

/**
 * A subtle 3px-tall bar at the absolute bottom of the overlay that fills
 * from left to right as the script progresses (0 to 1). Renders nothing
 * when progress is 0 to avoid a zero-width bar flash.
 */
export function ProgressBar({ progress }: ProgressBarProps) {
  if (progress <= 0) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-[3px] z-20">
      <div
        className="h-full bg-white/40"
        style={{
          width: `${Math.min(progress, 1) * 100}%`,
          transition: "width 200ms linear",
        }}
      />
    </div>
  );
}
