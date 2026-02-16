// ABOUTME: Strip below the overlay showing essential keyboard shortcuts.
// ABOUTME: Always visible in the transparent window area beneath the overlay.

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
 * Always visible regardless of play state for discoverability.
 */
export function ControlHints() {
  return (
    <div className="flex justify-center px-4 py-1 pointer-events-none">
      <div className="flex gap-4 bg-neutral-900 rounded-full px-4 py-1">
        {HINTS.map((hint) => (
          <span key={hint.key} className="text-white/90 text-xs font-mono whitespace-nowrap">
            <kbd className="text-white bg-white/15 px-1 py-0.5 rounded text-xs">
              {hint.key}
            </kbd>{" "}
            {hint.action}
          </span>
        ))}
      </div>
    </div>
  );
}
