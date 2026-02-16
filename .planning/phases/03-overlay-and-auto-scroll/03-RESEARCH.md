# Phase 3: Overlay and Auto-Scroll - Research

**Researched:** 2026-02-16
**Domain:** Teleprompter overlay window with markdown rendering, auto-scroll, keyboard controls, window management
**Confidence:** HIGH

## Summary

This phase transforms the existing static overlay (currently hardcoded text in a non-resizable, non-draggable window) into a fully functional teleprompter. The overlay needs: markdown rendering of the active script, smooth continuous auto-scrolling via `requestAnimationFrame`, keyboard-driven controls (play/pause, speed presets, rewind), visual polish (fade effect, progress bar, current-line highlight, countdown), and persistent window state (position, size, opacity, font size).

The primary technical challenges are: (1) communicating script content from the main window to the overlay window, (2) implementing smooth pixel-level scrolling that feels like a film credit roll, (3) managing multiple global shortcuts for teleprompter controls, and (4) making a decoration-less transparent overlay both draggable and resizable. All of these have well-supported solutions in the Tauri 2 ecosystem.

**Primary recommendation:** Use Tauri events (`emitTo`) for main-to-overlay communication, `requestAnimationFrame` for smooth scrolling, the existing `react-markdown` for rendering, and the Tauri store plugin (already in use) for persisting overlay preferences. Avoid the `tauri-plugin-window-state` plugin since the overlay has custom requirements (bottom-rounded corners, CALayer, always-on-top) that conflict with generic state restoration.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-markdown` | ^10.1.0 | Render markdown in overlay | Already used in MarkdownPreview component; same `components` prop pattern |
| `remark-gfm` | ^4.0.1 | GFM extension for markdown | Already in project; provides bullet list support needed for teleprompter |
| `zustand` | ^5.0.11 | State management for overlay | Already the app's state library; use for teleprompter state (scroll position, speed, playing) |
| `@tauri-apps/api` | ^2 | Window APIs, events | `emitTo`/`listen` for inter-window communication, `getCurrentWindow` for window control |
| `@tauri-apps/plugin-store` | ^2.4.2 | Persist overlay preferences | Already used via `tauriStorage.ts`; extend for overlay settings |
| `@tauri-apps/plugin-global-shortcut` | ^2 | Global keyboard shortcuts | Already registered for Cmd+Shift+S; extend for play/pause, speed, visibility |

### New (Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No new dependencies needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual overlay persistence | `tauri-plugin-window-state` | Plugin auto-saves position/size but conflicts with custom overlay setup (CALayer corners, content_protected, programmatic creation). Manual persistence via Tauri store is safer and more controllable. |
| `requestAnimationFrame` scroll | CSS `animation` with `translateY` | CSS animations are simpler but harder to pause/resume at arbitrary positions and harder to adjust speed dynamically. rAF gives frame-level control needed for speed presets and hover-to-pause. |
| `Intl.Segmenter` for sentences | Regex split on `.!?` | `Intl.Segmenter` handles abbreviations like "Dr." correctly but is only needed if scripts contain such edge cases. Simple regex is sufficient for teleprompter scripts. |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── overlay/
│   ├── App.tsx                    # Overlay root (update from static to teleprompter)
│   ├── main.tsx                   # Entry point (existing)
│   ├── index.html                 # Entry HTML (existing)
│   ├── components/
│   │   ├── TeleprompterView.tsx   # Scrolling markdown container with fade/highlight
│   │   ├── Countdown.tsx          # 3-2-1 countdown overlay
│   │   └── ProgressBar.tsx        # Bottom-edge progress indicator
│   └── hooks/
│       ├── useAutoScroll.ts       # requestAnimationFrame scroll engine
│       ├── useOverlayEvents.ts    # Listen for script content and control events
│       └── useOverlayControls.ts  # Local keyboard event handlers (space, etc.)
├── stores/
│   ├── scriptStore.ts             # (existing) — read activeContent/activeScriptId
│   ├── uiStore.ts                 # (existing) — extend or keep separate
│   └── teleprompterStore.ts       # NEW: teleprompter-specific state
├── persistence/
│   └── tauriStorage.ts            # (existing) — reuse for overlay preferences
└── components/
    └── toolbar/
        └── TopBar.tsx             # (existing) — wire up "Start Teleprompter" button
```

### Pattern 1: Inter-Window Communication via Tauri Events
**What:** Main window sends script content and control signals to the overlay via `emitTo`. Overlay listens for events on mount.
**When to use:** Any time the main window needs to communicate with the overlay (sending script, play/pause, launching teleprompter).

```typescript
// In main window — send script to overlay
import { emitTo } from '@tauri-apps/api/event';

async function launchTeleprompter(content: string) {
  await emitTo('overlay', 'teleprompter:load-script', { content });
  await emitTo('overlay', 'teleprompter:start');
}
```

```typescript
// In overlay window — listen for script content
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<{ content: string }>('teleprompter:load-script', (event) => {
    setScriptContent(event.payload.content);
  });
  return () => { unlisten.then(fn => fn()); };
}, []);
```

**Permissions required** in `overlay-window.json`:
```json
{
  "permissions": [
    "core:default",
    "core:event:default"
  ]
}
```

And in `main-window.json`, add:
```json
"core:event:default"
```

### Pattern 2: requestAnimationFrame Continuous Scroll Engine
**What:** A custom hook that drives smooth continuous scrolling using `requestAnimationFrame` with time-delta-based position updates.
**When to use:** The core teleprompter scroll mechanism.

```typescript
// useAutoScroll.ts — core scroll engine
function useAutoScroll(
  containerRef: React.RefObject<HTMLDivElement>,
  speedPxPerSec: number,
  isPlaying: boolean
) {
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !containerRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      return;
    }

    const container = containerRef.current;
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000; // seconds elapsed
      lastTimeRef.current = now;

      scrollPosRef.current += speedPxPerSec * delta;

      // Clamp to max scroll
      const maxScroll = container.scrollHeight - container.clientHeight;
      scrollPosRef.current = Math.min(scrollPosRef.current, maxScroll);

      container.scrollTop = scrollPosRef.current;

      if (scrollPosRef.current < maxScroll) {
        rafIdRef.current = requestAnimationFrame(step);
      }
      // else: end of script, stop silently
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isPlaying, speedPxPerSec, containerRef]);

  return {
    scrollPos: scrollPosRef,
    setScrollPos: (pos: number) => {
      scrollPosRef.current = pos;
      if (containerRef.current) {
        containerRef.current.scrollTop = pos;
      }
    }
  };
}
```

**Key design decisions:**
- Use `performance.now()` time-delta rather than fixed pixel-per-frame to handle variable frame rates
- Speed is expressed in pixels-per-second, not pixels-per-frame
- Scroll position is stored in a ref (not state) to avoid re-renders on every frame
- The `scrollTop` property is set directly for maximum performance

### Pattern 3: Teleprompter Store (Zustand)
**What:** A dedicated Zustand store for teleprompter state, persisted via Tauri store.
**When to use:** All teleprompter-specific state that needs to survive across sessions.

```typescript
// teleprompterStore.ts
interface TeleprompterState {
  // Persisted preferences
  fontSize: number;         // e.g., 24 (px)
  opacity: number;          // e.g., 0.95 (0-1)
  speedPreset: 'slow' | 'medium' | 'fast';

  // Runtime state (not persisted)
  isPlaying: boolean;
  scriptContent: string;
  showCountdown: boolean;
  countdownValue: number;
}
```

### Pattern 4: Overlay Window Resizable + Draggable (decorations: false)
**What:** With `decorations: false`, the overlay has no native resize handles. Use Tauri's `startResizeDragging(direction)` API triggered by mouse events on edge/corner zones.
**When to use:** The overlay window needs to be freely resizable.

The overlay must change from `resizable: false` to `resizable: true` in `overlay.rs`. Then CSS-based invisible edge zones detect mouse position and call `startResizeDragging`:

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

function handleMouseDown(e: React.MouseEvent, direction: string) {
  e.preventDefault();
  getCurrentWindow().startResizeDragging(direction);
}
```

The `ResizeDirection` type accepts: `'East'`, `'West'`, `'North'`, `'South'`, `'NorthEast'`, `'NorthWest'`, `'SouthEast'`, `'SouthWest'`.

Invisible resize zones (4-8px transparent strips) at window edges detect mouse approach and trigger the appropriate direction.

### Pattern 5: CSS Fade Effect at Top Edge
**What:** Use `mask-image` CSS property to create a gradient fade at the top of the scrolling container.
**When to use:** Already-read text fades out at the top while upcoming text remains fully visible.

```css
.teleprompter-scroll-container {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 100%
  );
}
```

### Anti-Patterns to Avoid
- **CSS `scroll-behavior: smooth` for teleprompter:** This is for anchor-link navigation, not continuous scrolling. It fights with `requestAnimationFrame` control.
- **`setInterval` for scrolling:** Leads to jank; `requestAnimationFrame` is synced to the display refresh rate and is the correct tool.
- **Zustand state for scroll position:** Storing scrollTop in React state causes 60 re-renders/second. Use refs for the scroll position; only store play/pause and speed in Zustand state.
- **Sharing Zustand store instance between windows:** Each Tauri window has its own JavaScript context. Stores are isolated. Use events for communication.
- **`marquee` element:** Deprecated, not controllable enough for pause/resume/speed changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom parser | `react-markdown` with `components` prop | Already in the project; handles headers, bold, italic, lists. Just adapt component styles for overlay context. |
| Window position/size persistence | Manual save/restore with window events | Tauri store plugin + `onMoved`/`onResized` debounced listeners | Tauri store is already set up; just save overlay geometry to same metadata.json. Debounce saves to avoid disk thrash. |
| Sentence boundary detection | Complex NLP parser | `Intl.Segmenter` with `granularity: 'sentence'` | Built into modern WebKit (Tauri uses WebKit on macOS). Handles abbreviations correctly. Zero dependencies. |
| Global shortcut management | Custom keyboard listener | `tauri-plugin-global-shortcut` (Rust-side handler) | Already using this plugin. Global shortcuts work even when overlay is not focused. Register all shortcuts in `lib.rs` setup. |
| Inter-window messaging | Custom IPC bridge | `emitTo` / `listen` from `@tauri-apps/api/event` | Built into Tauri core. Supports typed payloads. No extra dependencies. |

**Key insight:** The existing codebase already has most of the infrastructure. The main window has a script store with `activeContent`, the overlay has a separate entry point, and the Tauri backend handles window creation. The work is wiring these together, not building from scratch.

## Common Pitfalls

### Pitfall 1: Scroll Position Drift at Variable Frame Rates
**What goes wrong:** Using a fixed pixels-per-frame increment (e.g., `scrollTop += 1`) results in different scroll speeds on 60Hz vs 120Hz displays.
**Why it happens:** `requestAnimationFrame` fires once per display refresh. On a 120Hz display, the scroll runs twice as fast.
**How to avoid:** Always use time-delta-based calculation: `distance = speed * (now - lastTime) / 1000`.
**Warning signs:** Scroll speed feels different on external monitors vs laptop display.

### Pitfall 2: Overlay Events Not Received
**What goes wrong:** Overlay window cannot listen to events emitted from the main window.
**Why it happens:** The overlay capability file (`overlay-window.json`) currently only has `core:default`. Events require `core:event:default` permissions.
**How to avoid:** Add `core:event:default` to the overlay window's capabilities. Also ensure the main window's capabilities include event permissions.
**Warning signs:** `emitTo('overlay', ...)` succeeds but the overlay's `listen(...)` callback never fires.

### Pitfall 3: Window Resize Flash with CALayer Corners
**What goes wrong:** When the user resizes the overlay, the bottom-rounded corners temporarily show square corners or visual artifacts.
**Why it happens:** The CALayer corner mask is applied once at creation time. If the window size changes, the layer may need to be re-composited.
**How to avoid:** Ensure `masksToBounds` is set on the layer (already done in `overlay.rs`). The corner radius should persist through resizes since it's a percentage-independent fixed radius (16px). Test resizing thoroughly.
**Warning signs:** Sharp corners flash during active resize dragging.

### Pitfall 4: Hover-to-Pause Triggering on Resize Handles
**What goes wrong:** Moving the mouse to the edge resize zones triggers hover-to-pause before the user starts resize-dragging.
**Why it happens:** The `mouseenter` event on the overlay container fires when the cursor enters the window area, including resize edge zones.
**How to avoid:** Only trigger hover-to-pause on the inner content area, not the edge resize zones. Or use a small delay (100-200ms) before pausing to distinguish hover from resize intent.
**Warning signs:** Scrolling pauses unexpectedly when trying to resize.

### Pitfall 5: Global Shortcut Conflicts
**What goes wrong:** Registering a global shortcut (e.g., Space) that conflicts with system shortcuts or other apps.
**Why it happens:** Global shortcuts are system-wide and intercept keys before other apps.
**How to avoid:** Use modifier keys for global shortcuts (e.g., Cmd+Shift+key). Space-to-pause should only be a local shortcut (active when overlay is focused), not a global one.
**Warning signs:** Space stops working in other apps when the teleprompter is running.

### Pitfall 6: Minimizing Main Window Fails Silently
**What goes wrong:** Calling `getCurrentWindow().minimize()` from the main window requires the `core:window:allow-minimize` permission.
**Why it happens:** Tauri 2 capability permissions are granular; the default set does not include all window operations.
**How to avoid:** Add all needed window permissions to `main-window.json`: `core:window:allow-minimize`, `core:window:allow-set-focus`, etc.
**Warning signs:** The main window stays visible when the teleprompter launches; no error in console unless you check the Rust logs.

### Pitfall 7: Store Isolation Between Windows
**What goes wrong:** Expecting the overlay window to access the same Zustand store instance as the main window.
**Why it happens:** Each Tauri window runs its own JavaScript context. Zustand stores are not shared between windows.
**How to avoid:** Send the script content to the overlay via Tauri events when launching the teleprompter. Do not assume the overlay can read `useScriptStore`.
**Warning signs:** `useScriptStore.getState().activeContent` returns empty string or stale data in the overlay window.

## Code Examples

### Launching Teleprompter from Main Window
```typescript
// In TopBar.tsx or wherever "Start Teleprompter" button lives
import { emitTo } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

async function startTeleprompter() {
  const content = useScriptStore.getState().activeContent;
  if (!content) return;

  // Send script to overlay
  await emitTo('overlay', 'teleprompter:load-script', { content });

  // Tell overlay to begin countdown
  await emitTo('overlay', 'teleprompter:start-countdown');

  // Minimize main window to dock
  await getCurrentWindow().minimize();
}
```

### Overlay Listening for Events
```typescript
// In overlay App.tsx or useOverlayEvents hook
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const listeners = [
    listen<{ content: string }>('teleprompter:load-script', (e) => {
      setContent(e.payload.content);
    }),
    listen('teleprompter:start-countdown', () => {
      startCountdown();
    }),
    listen('teleprompter:toggle-play', () => {
      togglePlay();
    }),
  ];

  return () => {
    listeners.forEach(p => p.then(fn => fn()));
  };
}, []);
```

### Countdown Timer Component
```typescript
// Countdown.tsx
function Countdown({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <span className="text-white/90 text-7xl font-bold tabular-nums">
        {count}
      </span>
    </div>
  );
}
```

### CSS for Fade + Current Line Highlight
```css
/* Top-edge fade using mask-image */
.teleprompter-container {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 100%
  );
}

/* Progress bar at bottom edge */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.4);
  transition: width 100ms linear;
}
```

### Rewind to Previous Sentence
```typescript
// Using Intl.Segmenter for sentence detection
function findPreviousSentenceStart(text: string, currentCharOffset: number): number {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = Array.from(segmenter.segment(text));

  let lastStart = 0;
  for (const segment of segments) {
    if (segment.index >= currentCharOffset) break;
    lastStart = segment.index;
  }
  return lastStart;
}
```

### Persisting Overlay Geometry
```typescript
// Debounced save of overlay position and size
import { getCurrentWindow } from '@tauri-apps/api/window';

async function saveOverlayGeometry() {
  const win = getCurrentWindow();
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const scale = await win.scaleFactor();

  // Convert physical to logical
  const logicalPos = pos.toLogical(scale);
  const logicalSize = size.toLogical(scale);

  // Save to Tauri store
  const store = await getStore();
  await store.set('overlay-geometry', {
    x: logicalPos.x,
    y: logicalPos.y,
    width: logicalSize.width,
    height: logicalSize.height,
  });
}
```

### Custom Resize Handles for Decoration-less Window
```typescript
// Edge detection zones for resize-dragging
const EDGE_SIZE = 6; // px

function getResizeDirection(
  e: MouseEvent,
  width: number,
  height: number
): string | null {
  const x = e.clientX;
  const y = e.clientY;

  const onLeft = x < EDGE_SIZE;
  const onRight = x > width - EDGE_SIZE;
  const onTop = y < EDGE_SIZE;
  const onBottom = y > height - EDGE_SIZE;

  if (onTop && onLeft) return 'NorthWest';
  if (onTop && onRight) return 'NorthEast';
  if (onBottom && onLeft) return 'SouthWest';
  if (onBottom && onRight) return 'SouthEast';
  if (onTop) return 'North';
  if (onBottom) return 'South';
  if (onLeft) return 'West';
  if (onRight) return 'East';
  return null;
}
```

### Registering Multiple Global Shortcuts (Rust)
```rust
// In lib.rs — extending the existing shortcut handler
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// Define all shortcuts
fn toggle_overlay_shortcut() -> Shortcut {
    Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyS)
}

fn toggle_play_shortcut() -> Shortcut {
    Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space)
}

fn speed_cycle_shortcut() -> Shortcut {
    Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyD)
}

// In setup, register with a single handler that matches shortcuts
.plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state() != ShortcutState::Pressed { return; }

            if *shortcut == toggle_overlay_shortcut() {
                overlay::toggle_overlay(app).ok();
            } else if *shortcut == toggle_play_shortcut() {
                app.emit_to("overlay", "teleprompter:toggle-play", ()).ok();
            } else if *shortcut == speed_cycle_shortcut() {
                app.emit_to("overlay", "teleprompter:cycle-speed", ()).ok();
            }
        })
        .build(),
)
// Then register each shortcut:
app.global_shortcut().register(toggle_overlay_shortcut())?;
app.global_shortcut().register(toggle_play_shortcut())?;
app.global_shortcut().register(speed_cycle_shortcut())?;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `marquee` element | `requestAnimationFrame` scroll | Always (marquee deprecated) | Full control over speed, pause, resume |
| Regex sentence splitting | `Intl.Segmenter` | Chrome 87+, Safari 15.4+, Firefox 127+ | Handles abbreviations, locale-aware |
| Tauri v1 `registerAll` | Tauri v2 multiple `register()` calls | Tauri 2.0 | Each shortcut registered individually |
| Tauri v1 `__all` event target | Tauri v2 `emitTo(windowLabel)` | Tauri 2.0 | Targeted inter-window events |

**Deprecated/outdated:**
- `marquee` HTML element: Deprecated, use requestAnimationFrame
- Tauri v1 `registerAll()`: Replaced by individual `register()` calls in v2
- Tauri v1 `appWindow` global: Replaced by `getCurrentWindow()` in v2

## Open Questions

1. **Overlay resizable with decorations: false on macOS**
   - What we know: Tauri 2.0 stable fixed a bug (#8519) where undecorated windows could not be resized. The fix was merged in beta.0. The `startResizeDragging(direction)` API exists with 8 directional values.
   - What's unclear: Whether `.resizable(true)` with `.decorations(false)` provides native edge-drag resize on macOS without needing custom resize handles, or whether custom edge detection is always needed.
   - Recommendation: First try changing `.resizable(false)` to `.resizable(true)` in `overlay.rs` and test if macOS provides native resize handles on the undecorated window. If not, implement CSS edge-zone detection with `startResizeDragging`.

2. **CALayer corners during resize**
   - What we know: The CALayer corner radius is set at creation time with a fixed 16px radius and `masksToBounds(true)`. The radius is absolute, not percentage-based.
   - What's unclear: Whether dynamic resizing causes any visual glitches with the corner masking.
   - Recommendation: Test early. If corners flash during resize, re-apply the corner mask in an `onResized` callback (via Rust command or native API).

3. **Speed preset values**
   - What we know: Three presets (slow, medium, fast) are needed. Typical teleprompter scroll rates range from 40-120 pixels/second depending on font size and reading speed.
   - What's unclear: The exact px/sec values that feel right for this app's font size and overlay dimensions.
   - Recommendation: Start with slow=40, medium=70, fast=110 px/sec. Tune based on testing with the actual font size and overlay height.

4. **Hover-to-pause with transparent edges**
   - What we know: The overlay has transparent corners (from CALayer masking). Mouse events in transparent areas may or may not register depending on the platform.
   - What's unclear: Whether `mouseenter` fires when the cursor enters the transparent corner region of the overlay.
   - Recommendation: Bind hover-to-pause on the inner content div, not the window itself. This naturally excludes the rounded corner areas.

## Sources

### Primary (HIGH confidence)
- [Tauri v2 Window API Reference](https://v2.tauri.app/reference/javascript/api/namespacewindow/) - Window methods: setPosition, setSize, minimize, startResizeDragging, onMoved, onResized
- [Tauri v2 Event API Reference](https://v2.tauri.app/reference/javascript/api/namespaceevent/) - emit, emitTo, listen functions and types
- [Tauri v2 WebviewWindow API](https://v2.tauri.app/reference/javascript/api/namespacewebviewwindow/) - WebviewWindow class, ResizeDirection type
- [Tauri v2 Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/) - Registration, multiple shortcuts, Rust handler pattern
- [Tauri v2 Window State Plugin](https://v2.tauri.app/plugin/window-state/) - StateFlags, save/restore API (evaluated but not recommended)
- [Tauri v2 Core Permissions](https://v2.tauri.app/reference/acl/core-permissions/) - Event and window permission identifiers
- [Tauri window.ts source](https://github.com/tauri-apps/tauri/blob/dev/packages/api/src/window.ts) - ResizeDirection enum: 'East' | 'West' | 'North' | 'South' | 'NorthEast' | 'NorthWest' | 'SouthEast' | 'SouthWest'

### Secondary (MEDIUM confidence)
- [Zustand multi-window sync pattern](https://www.gethopp.app/blog/tauri-window-state-sync) - Event-based state broadcasting between Tauri windows
- [60FPS smooth scrolling with requestAnimationFrame](https://gist.github.com/drwpow/17f34dc5043a31017f6bbc8485f0da3c) - Time-delta scroll engine pattern
- [CSS mask-image fade effect](https://pqina.nl/blog/fade-out-overflow-using-css-mask-image) - Gradient mask for edge fading
- [MDN Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) - Sentence granularity segmentation

### Tertiary (LOW confidence)
- [Tauri #8519 undecorated resize fix](https://github.com/tauri-apps/tauri/issues/8519) - Confirmed fixed but macOS-specific behavior needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project; APIs verified against official Tauri v2 docs
- Architecture: HIGH - Inter-window event pattern is well-documented; rAF scroll engine is a standard technique
- Pitfalls: HIGH - Each pitfall identified from official docs, known issues, and architectural analysis of the existing codebase
- Resize/drag on undecorated window: MEDIUM - API exists and bug was fixed, but macOS-specific edge behavior needs validation

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - Tauri 2 is stable, APIs unlikely to change)
