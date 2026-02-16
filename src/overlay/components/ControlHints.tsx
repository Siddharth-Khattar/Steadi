// ABOUTME: Strip below the overlay showing essential keyboard shortcuts.
// ABOUTME: Visible when paused, fades out during scrolling. Renders in the transparent window area beneath the overlay.

import { useTeleprompterStore } from "../../stores/teleprompterStore";

const isMac =
  typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const MOD = isMac ? "Cmd" : "Ctrl";

const HINTS = [
  { key: "Space", action: "play/pause" },
  { key: `${MOD}+Shift+D`, action: "speed" },
  { key: `${MOD}+Shift+A`, action: "rewind" },
  { key: "?", action: "all shortcuts" },
];

/**
 * A row of essential shortcut hints rendered below the dark overlay background.
 * Sits in the transparent window area so it appears as a floating extension.
 * Fades out when the teleprompter is scrolling so it doesn't distract.
 */
export function ControlHints() {
  const isPlaying = useTeleprompterStore((s) => s.isPlaying);

  return (
    <div
      className="flex justify-center gap-4 px-4 py-1 pointer-events-none transition-opacity duration-500"
      style={{ opacity: isPlaying ? 0 : 0.5 }}
    >
      {HINTS.map((hint) => (
        <span key={hint.key} className="text-white text-[10px] font-mono whitespace-nowrap">
          <kbd className="text-white bg-white/10 px-1 py-0.5 rounded text-[10px]">
            {hint.key}
          </kbd>{" "}
          {hint.action}
        </span>
      ))}
    </div>
  );
}
