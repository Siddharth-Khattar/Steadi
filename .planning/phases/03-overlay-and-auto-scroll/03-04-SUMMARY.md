---
phase: 03-overlay-and-auto-scroll
plan: 04
subsystem: ui
tags: [keyboard-controls, click-to-toggle, rewind, speed-indicator, keymap-guide, editor-fab, monitor-cycling, overlay-polish]

# Dependency graph
requires:
  - phase: 03-02
    provides: "Overlay teleprompter UI with scroll engine, markdown rendering, countdown, progress bar"
  - phase: 03-03
    provides: "Start button wiring, overlay drag/resize, geometry persistence"
provides:
  - "Local and global keyboard controls for all teleprompter operations"
  - "Click-to-toggle playback on overlay content area"
  - "Speed indicator toast on speed preset changes"
  - "Keymap guide overlay (? key toggle)"
  - "Control hints bar always visible below overlay"
  - "Editor FAB for returning to editor after minimization"
  - "Multi-monitor overlay cycling"
  - "Green emerald progress bar with glow"
  - "Improved markdown list rendering (list-outside alignment)"
affects: [04-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React onClick prop for click-to-toggle (avoids stale-ref issues with conditional rendering)"
    - "Editor FAB as separate Tauri window for post-minimize access"
    - "Monitor cycling via Tauri currentMonitor/availableMonitors API"
    - "Persisted store migration pattern with version bumps"

key-files:
  created:
    - "src/overlay/hooks/useOverlayControls.ts"
    - "src/overlay/components/KeymapGuide.tsx"
    - "src/overlay/components/ControlHints.tsx"
    - "src/overlay/components/MonitorCycleButton.tsx"
    - "src/overlay/utils/cycleMonitor.ts"
    - "src/overlay/utils/snapToMonitorTopCenter.ts"
    - "src/editor-fab/App.tsx"
    - "src/editor-fab/main.tsx"
    - "src/editor-fab/index.html"
    - "src-tauri/src/editor_fab.rs"
  modified:
    - "src/overlay/App.tsx"
    - "src/overlay/components/ProgressBar.tsx"
    - "src/overlay/components/TeleprompterView.tsx"
    - "src/overlay/hooks/useOverlayEvents.ts"
    - "src/overlay/hooks/useOverlayGeometry.ts"
    - "src-tauri/src/lib.rs"
    - "src/stores/teleprompterStore.ts"
    - "src/styles/globals.css"
    - "src/components/toolbar/TopBar.tsx"

key-decisions:
  - "Click-to-toggle replaces hover-to-pause — hover conflicts with click (hovering to click would pause before the click fires)"
  - "Editor FAB replaces simple window.minimize — gives users a visible way back to the editor"
  - "Global shortcuts remapped: overlay toggle→Cmd+Shift+F, speed→Cmd+Shift+S, rewind→Cmd+Shift+R"
  - "Top-edge fade removed — user preference for clean text presentation"
  - "Font size controls use Cmd/Ctrl +/- (not bracket keys) for intuitiveness"
  - "Opacity controls use plain +/- (without modifier) for quick adjustment"
  - "Persisted store defaults require version bump + migration to apply on existing installations"
  - "Default font size settled at 16px after iterative tuning"

patterns-established:
  - "useOverlayControls returns stable callbacks (via useCallback) that callers wire to JSX props"
  - "Persisted store migration: bump version, add migrate guard, reset stale default"
  - "Editor FAB: separate Tauri window created on startup, shown/hidden alongside overlay"

# Metrics
duration: iterative (across multiple sessions)
completed: 2026-02-16
---

# Phase 3 Plan 4: Controls, Polish, and End-to-End Integration Summary

**Local/global keyboard controls, click-to-toggle playback, editor FAB, monitor cycling, progress bar polish, and end-to-end teleprompter integration**

## Performance

- **Duration:** Iterative across multiple sessions (2026-02-16)
- **Commits:** 12 (from a861292 through 3195acb)
- **Files modified:** 25+

## Accomplishments

### Core Controls (original plan scope)
- Local keyboard controls: Space (play/pause), Escape (stop & close), Cmd/Ctrl+/-  (font size), -/+ (opacity), ? (keymap guide)
- Global shortcuts: Cmd+Shift+Space (play/pause), Cmd+Shift+S (speed cycle), Cmd+Shift+R (rewind), Cmd+Shift+W/X (scroll up/down), Cmd+Shift+F (toggle overlay)
- Click-to-toggle playback on content area (replaced hover-to-pause from original plan)
- Pixel-based rewind: scrolls back ~1/3 of visible viewport height per press
- Speed indicator toast appears briefly when cycling presets (Slow → Medium → Fast)
- Keymap guide overlay toggled with ? key, auto-dismisses after 6 seconds

### Additional Features (beyond original plan)
- Editor FAB (floating action button): separate Tauri window shown when editor minimizes, provides "back to editor" access
- Multi-monitor overlay cycling: button to move overlay between connected monitors
- Overlay snap-to-center when cycling monitors
- Always-visible control hints bar below overlay showing key shortcuts
- Scroll position reset when restarting teleprompter

### Visual Polish
- Emerald green progress bar (4px) with glow shadow and rounded leading edge
- Markdown list rendering: list-outside with proper bullet/number alignment
- Removed top-edge text fade for cleaner presentation
- Control hints pill with opaque dark background for readability
- Default font size tuned to 16px through iterative testing

### Infrastructure
- Persisted store migration pattern: version bumps + migrate function for changing defaults
- Migration rule documented in CLAUDE.md for future reference

## Deviations from Plan

### Design Changes

**1. Hover-to-pause replaced with click-to-toggle**
- **Original plan:** Mouse hover over overlay freezes scrolling; mouseleave resumes
- **Actual implementation:** Click anywhere on overlay content to toggle play/pause
- **Reason:** Hover-to-pause conflicts with click interactions — hovering to click would pause before the click fires. Click-to-toggle is simpler and more intentional.

**2. Font size controls changed from brackets to Cmd/Ctrl +/-**
- **Original plan:** `[` decrease, `]` increase font size
- **Actual implementation:** `Cmd/Ctrl+-` decrease, `Cmd/Ctrl+=` increase (matches standard OS conventions)
- **Reason:** More intuitive; matches browser/OS zoom shortcuts users already know

**3. Global shortcuts remapped**
- **Original:** S (overlay), D (speed), A (rewind)
- **Actual:** F (overlay), S (speed), R (rewind)
- **Reason:** More mnemonic (F=focus, S=speed, R=rewind)

**4. Editor FAB added (not in original plan)**
- After editor minimizes, users need a way back. A floating action button appears over the overlay providing "restore editor" access.

**5. Monitor cycling added (not in original plan)**
- For multi-monitor setups, users can cycle the overlay between screens via a button on the overlay.

**6. Top-edge fade removed**
- **Original plan:** CSS mask-image fading top 12% of scroll content
- **Actual:** Removed entirely for cleaner text presentation

## Issues Encountered

- Persisted Zustand store defaults don't apply to existing installations without migration — required adding version bump + migrate pattern (documented in CLAUDE.md)
- Native macOS window resize (resizable: true) enabled undesirable top-edge dragging; solved by disabling native resize and using custom WindowControls resize handles exclusively
- Click handler via useEffect + addEventListener failed when TeleprompterView was conditionally rendered (stale ref) — fixed by returning a React onClick callback from the hook

## Next Phase Readiness
- Phase 3 is fully complete: teleprompter is production-usable
- All overlay controls operational via keyboard and mouse
- Geometry, font size, opacity, and speed preset all persist across restarts
- Ready for Phase 4 (Voice Sync on macOS)

---
*Phase: 03-overlay-and-auto-scroll*
*Completed: 2026-02-16*
