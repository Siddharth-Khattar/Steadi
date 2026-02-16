# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** The teleprompter overlay must be completely invisible during screen sharing while scrolling in sync with the user's voice
**Current focus:** Phase 3 in progress (Overlay and Auto-Scroll)

## Current Position

Phase: 3 of 5 (Overlay and Auto-Scroll)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-02-16 — Completed 03-03-PLAN.md (start button, drag/resize, geometry persistence)

Progress: [███████░░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 7 min
- Total execution time: ~1 hour

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Platform Validation Spike | 3/3 | 45 min | 15 min |
| 2. Script Editor | 4/4 | ~12 min | 3 min |
| 3. Overlay and Auto-Scroll | 3/4 | 8 min | 3 min |

**Recent Trend:**
- Last 5 plans: 3 min, 3 min, 2 min, 3 min, 3 min
- Trend: stable fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Platform validation spike as Phase 1 -- prove invisibility before feature investment
- [Roadmap]: Auto-scroll before voice sync -- proves scroll architecture and provides fallback
- [Roadmap]: macOS voice before Windows voice -- defines adapter trait contract
- [01-01]: WebviewUrl imported from tauri crate root, not tauri::webview (Tauri 2.10 API change)
- [01-01]: Overlay created dynamically in Rust setup closure with WebviewWindowBuilder
- [01-02]: GlassPanel is CSS refinement layer (bg-white/5, shadow, border) — available for future phases
- [01-02]: Separate App.tsx per window entry point pattern established
- [01-03]: HTML entry points must be at root level for Vite production asset paths to resolve correctly
- [01-03]: GO for Phase 2 — overlay invisibility validated on macOS with Zoom, Meet, web recorders
- [Post-01]: **Vibrancy effects removed** — HudWindow/Acrylic replaced with solid black CSS background. Native vibrancy was inherently translucent (frosted glass) even at max alpha. User wants opaque dark overlay.
- [Post-01]: **Native CALayer API for bottom-only rounded corners** — CSS border-radius can't affect the macOS window shape. Uses objc2-app-kit to set NSWindow contentView.layer.maskedCorners directly. Added objc2-app-kit, objc2-quartz-core, objc2-foundation as macOS-only deps.
- [Post-01]: Overlay width reduced from 55% to 40% of screen width, height 140pt
- [Post-01]: **Notch-blending deferred** — Placing overlay IN the menu bar area requires NSWindow.level = .statusBar or higher. macOS constrains regular windows below menu bar even at y=0. Needs dedicated research.
- [02-01]: Tauri store plugin StoreOptions requires `defaults` field; pass empty object with autoSave: true
- [02-01]: Script content persisted as individual .md files on filesystem; metadata via Tauri store JSON
- [02-01]: Zustand partialize excludes activeContent and isLoading from persistence
- [02-01]: setActiveScript flushes pending content for previous script before switching
- [02-02]: Extension type imported from @codemirror/state, not @codemirror/view
- [02-02]: user-select override via inline style for reliable cross-webkit behavior
- [02-03]: toggleFolderCollapse added to scriptStore (persisted via Folder type) rather than local component state
- [02-03]: Context menus as simple fixed-position divs with click-outside/Escape listeners, no library
- [02-03]: Multi-container DnD: each FolderItem owns a SortableContext, DndContext at Sidebar level
- [02-04]: Sidebar decoupled from react-resizable-panels — rendered outside PanelGroup with fixed width and CSS transition
- [02-04]: MarkdownPreview uses react-markdown components prop for styling (no @tailwindcss/typography)
- [02-04]: TopBar uses data-tauri-drag-region for window dragging
- [Post-02]: activeFolderId tracks last-interacted folder for toolbar script creation target
- [Post-02]: ConfirmDialog shared component replaces window.confirm for delete confirmations
- [Post-02]: App icons replaced with Steadi branding (all platforms)
- [03-01]: emit_to lives on Emitter trait in Tauri 2.10, not Manager
- [03-01]: Platform modifiers extracted to shared helper; non-critical shortcuts use .ok() on register
- [03-01]: teleprompterStore partialize persists only fontSize/opacity/speedPreset, not runtime state
- [03-02]: Countdown calls decrementCountdown (not setPlaying); store auto-transitions to isPlaying on count=0
- [03-02]: Reading-line highlight is a static CSS band at 30% from top, not dynamic
- [03-02]: Overlay-specific markdown components separate from MarkdownPreview for independent tuning
- [03-03]: ResizeDirection type defined locally (not exported from @tauri-apps/api/window)
- [03-03]: Overlay geometry stored in separate overlay-geometry.json store (not teleprompter-store)
- [03-03]: 300ms debounce on geometry saves to avoid disk thrash during drag/resize

### Pending Todos

- Windows invisibility testing when Windows dev environment is available
- Windows overlay styling (no CALayer API — needs Windows-specific approach for rounded corners and solid background)
- Investigate macOS 15+ ScreenCaptureKit bypass if specific apps found to capture overlay
- Research NSWindow.level = .statusBar for notch-blending overlay positioning on macOS

### Blockers/Concerns

- [Research]: macOS 15+ ScreenCaptureKit ignores NSWindow.sharingType = .none -- not observed in testing (Zoom, Meet, web recorders all respect it), but remains a concern for ScreenCaptureKit-native capture tools
- [Research]: Windows WebView2 + SetWindowDisplayAffinity has documented COMException conflicts with transparent windows -- deferred until Windows testing
- [Research]: SFSpeechRecognizer timestamp resets after ~60s -- must use text-matching, not timestamps, for scroll positioning

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 03-03-PLAN.md (start button, drag/resize, geometry persistence)
Resume file: None
