// ABOUTME: Semi-transparent overlay showing all keyboard shortcuts for the teleprompter.
// ABOUTME: Groups shortcuts by scope (global vs local), platform-aware labels, auto-dismisses after 6s.

interface KeymapGuideProps {
  visible: boolean;
  onDismiss: () => void;
}

interface ShortcutEntry {
  keys: string;
  description: string;
}

const isMac =
  typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const MOD = isMac ? "Cmd" : "Ctrl";

const GLOBAL_SHORTCUTS: ShortcutEntry[] = [
  { keys: `${MOD}+Shift+Space`, description: "Toggle play / pause" },
  { keys: `${MOD}+Shift+D`, description: "Cycle speed (slow / med / fast)" },
  { keys: `${MOD}+Shift+A`, description: "Rewind ~1/3 screen" },
  { keys: `${MOD}+Shift+Up`, description: "Scroll up" },
  { keys: `${MOD}+Shift+Down`, description: "Scroll down" },
];

const LOCAL_SHORTCUTS: ShortcutEntry[] = [
  { keys: "Space", description: "Toggle play / pause" },
  { keys: "Esc", description: "Stop & close script" },
  { keys: `${MOD}+-  /  ${MOD}++`, description: "Decrease / increase font" },
  { keys: "-  /  +", description: "Decrease / increase opacity" },
  { keys: "?", description: "Toggle this guide" },
];

/**
 * A semi-transparent overlay that displays all available keyboard shortcuts
 * grouped by scope. Auto-dismisses after 6 seconds (handled by the parent
 * hook) or on any non-"?" keypress. Rendered above all other overlay content.
 */
export function KeymapGuide({ visible, onDismiss }: KeymapGuideProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-white/10 rounded-xl px-8 py-6 max-w-sm w-full mx-4 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <ShortcutGroup title="Global (any app)" entries={GLOBAL_SHORTCUTS} />
        <ShortcutGroup title="Local (overlay focused)" entries={LOCAL_SHORTCUTS} />

        <p className="text-white/30 text-xs text-center pt-1">
          Press <kbd className="text-white/50">?</kbd> or click outside to dismiss
        </p>
      </div>
    </div>
  );
}

function ShortcutGroup({
  title,
  entries,
}: {
  title: string;
  entries: ShortcutEntry[];
}) {
  return (
    <div>
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.keys}
            className="flex items-center justify-between gap-4"
          >
            <kbd className="text-white/80 text-sm font-mono bg-white/5 px-2 py-0.5 rounded shrink-0">
              {entry.keys}
            </kbd>
            <span className="text-white/50 text-sm text-right">
              {entry.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
