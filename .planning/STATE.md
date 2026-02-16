# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** The teleprompter overlay must be completely invisible during screen sharing while scrolling in sync with the user's voice
**Current focus:** Phase 2 in progress (Script Editor) — Plan 1 complete, 3 remaining

## Current Position

Phase: 2 of 5 (Script Editor) — IN PROGRESS
Plan: 1 of 4 in Phase 2
Status: In progress
Last activity: 2026-02-16 — Completed 02-01-PLAN.md (Foundation and Persistence)

Progress: [███.......] 29%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 12 min
- Total execution time: 0.82 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Platform Validation Spike | 3/3 | 45 min | 15 min |
| 2. Script Editor | 1/4 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 13 min, 2 min, 30 min, 4 min
- Trend: improving (02-01 was dependency install + type definitions)

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

### Pending Todos

- Replace placeholder icons with proper Steadi branding icons
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
Stopped at: Completed 02-01-PLAN.md (Foundation and Persistence)
Resume file: None
