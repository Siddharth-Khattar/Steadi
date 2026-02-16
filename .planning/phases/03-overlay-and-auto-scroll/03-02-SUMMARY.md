---
phase: 03-overlay-and-auto-scroll
plan: 02
subsystem: ui
tags: [react-markdown, requestAnimationFrame, teleprompter, overlay, auto-scroll, tauri-events]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Teleprompter Zustand store, Tauri event capabilities, global shortcuts"
  - phase: 02-04
    provides: "react-markdown components prop pattern from MarkdownPreview"
provides:
  - "rAF scroll engine hook (useAutoScroll) with time-delta position updates"
  - "Overlay event listener hook (useOverlayEvents) bridging Tauri events to store"
  - "Teleprompter overlay UI: markdown rendering, countdown, progress bar, fade effect"
affects: [03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "requestAnimationFrame scroll engine with performance.now() time-delta"
    - "Throttled progress reporting from animation loop (~200ms)"
    - "CSS mask-image for top-edge fade effect on scrolling container"
    - "Overlay-specific react-markdown components for teleprompter context"

key-files:
  created:
    - "src/overlay/hooks/useAutoScroll.ts"
    - "src/overlay/hooks/useOverlayEvents.ts"
    - "src/overlay/components/TeleprompterView.tsx"
    - "src/overlay/components/Countdown.tsx"
    - "src/overlay/components/ProgressBar.tsx"
  modified:
    - "src/overlay/App.tsx"
    - "src/styles/globals.css"

key-decisions:
  - "Countdown triggers decrementCountdown from store (which auto-sets isPlaying on reaching 0)"
  - "Reading-line highlight is a static visual guide at 30% from top, not tracking specific lines"
  - "Overlay-specific markdown components separate from MarkdownPreview to allow independent tuning"

patterns-established:
  - "Scroll position stored in ref, not React state, to avoid 60 re-renders/sec"
  - "useAutoScroll returns getScrollPosition/setScrollPosition for external control (rewind, manual scroll)"
  - "useOverlayEvents uses callback params for non-store actions (rewind, scroll-up/down)"

# Metrics
duration: 3min
completed: 2026-02-16
---

# Phase 3 Plan 2: Teleprompter Overlay UI Summary

**rAF scroll engine with time-delta updates, markdown rendering via react-markdown, 3-2-1 countdown, top-edge fade, progress bar, and reading-line highlight**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-16T03:16:48Z
- **Completed:** 2026-02-16T03:19:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- requestAnimationFrame scroll engine with time-delta position updates and throttled progress reporting to store
- Overlay event listener hook bridging 7 Tauri events to store actions and callbacks
- TeleprompterView with react-markdown rendering, CSS mask-image top fade, and hidden scrollbar
- Countdown overlay (3-2-1) with dimmed background, auto-starts scrolling on completion
- ProgressBar (3px bottom edge) showing scroll progress left-to-right
- Reading-line highlight guide at 30% from top with subtle bg-white/[0.03]
- "No script loaded" placeholder when overlay has no content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scroll engine hook and overlay event listener hook** - `928c828` (feat)
2. **Task 2: Create overlay components and rewrite overlay App.tsx** - `89447bb` (feat)

## Files Created/Modified
- `src/overlay/hooks/useAutoScroll.ts` - rAF scroll engine with time-delta, throttled progress, manual position control
- `src/overlay/hooks/useOverlayEvents.ts` - Tauri event listeners routing to store actions and callbacks
- `src/overlay/components/TeleprompterView.tsx` - Scrolling markdown container with overlay-tuned styles
- `src/overlay/components/Countdown.tsx` - 3-2-1 countdown overlay component
- `src/overlay/components/ProgressBar.tsx` - Bottom-edge progress indicator
- `src/overlay/App.tsx` - Rewritten to host teleprompter UI with all hooks and components wired
- `src/styles/globals.css` - Added teleprompter-fade mask-image and scrollbar-hide CSS

## Decisions Made
- [03-02]: Countdown calls `decrementCountdown` from store (not `setPlaying`), because the store's decrementCountdown auto-transitions to `isPlaying: true` when count reaches 0
- [03-02]: Reading-line highlight is a static CSS band at 30% from top (bg-white/[0.03]), not a dynamic line tracker
- [03-02]: Overlay markdown components are separate from MarkdownPreview's components to allow independent tuning for the teleprompter context (different sizes, spacing, color values)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Overlay UI fully functional: renders markdown, runs countdown, scrolls via rAF, shows progress
- Ready for Plan 03-03 (window controls: resize, drag, position persistence)
- Ready for Plan 03-04 (main-window integration: "Start Teleprompter" button, minimize-to-dock flow)
- Events are already wired: global shortcuts from Plan 03-01 dispatch events that useOverlayEvents now handles

---
*Phase: 03-overlay-and-auto-scroll*
*Completed: 2026-02-16*
