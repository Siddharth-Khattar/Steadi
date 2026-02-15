---
phase: 01-platform-validation-spike
verified: 2026-02-15T20:04:17Z
status: gaps_found
score: 3/5 must-haves verified
gaps:
  - truth: "A transparent always-on-top overlay window is visible on the desktop but does not appear in Zoom, Teams, Meet, or OBS screen shares on Windows"
    status: failed
    reason: "Windows has not been tested at all -- no Windows machine available. The code includes Windows-targeted APIs (Acrylic effect, WDA_EXCLUDEFROMCAPTURE via content_protected), but zero empirical validation exists."
    artifacts:
      - path: "src-tauri/src/overlay.rs"
        issue: "Windows code paths exist (.effect(Effect::Acrylic)) but are untested"
    missing:
      - "Windows machine to run production build and test screen share invisibility"
      - "Windows entries in COMPATIBILITY-MATRIX.md with actual test results"
      - "Verification of WebView2 transparent window + SetWindowDisplayAffinity interaction (research flagged COMException risk)"
  - truth: "The overlay renders near top-center of screen (notch-style positioning) with glassmorphic frosted-glass appearance using native vibrancy APIs"
    status: partial
    reason: "Positioning and vibrancy are implemented and working. However, human testing confirmed the overlay sits BELOW the notch rather than blending with it, and the glassmorphic style does not match the user's desired dark/black notch aesthetic. The user specifically noted they want a notch-blending dark overlay, not frosted glass."
    artifacts:
      - path: "src-tauri/src/overlay.rs"
        issue: "y=0 positioning places overlay below notch on notched MacBooks; glassmorphic HudWindow style doesn't match desired dark/black notch aesthetic"
    missing:
      - "Positioning adjustment to account for notch area on MacBook displays (y offset into safe area or notch-blending)"
      - "Design iteration: dark/black opaque style instead of frosted-glass glassmorphic (user feedback)"
---

# Phase 1: Platform Validation Spike Verification Report

**Phase Goal:** The invisible overlay -- Steadi's core value proposition -- is proven to work on both macOS and Windows before any feature investment
**Verified:** 2026-02-15T20:04:17Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Transparent always-on-top overlay invisible to screen shares on macOS (14 and 15+) | VERIFIED | Human tested: Zoom (PASS), Google Meet (PASS), web recorders (PASS). `content_protected(true)` at overlay.rs:49. COMPATIBILITY-MATRIX.md documents results. |
| 2 | Transparent always-on-top overlay invisible to screen shares on Windows | FAILED | No Windows testing performed. Code has `Effect::Acrylic` and `content_protected(true)` but zero empirical validation. COMPATIBILITY-MATRIX.md explicitly lists Windows as "Not Yet Tested". |
| 3 | Overlay renders near top-center with glassmorphic frosted-glass appearance using native vibrancy APIs | PARTIAL | Native vibrancy (HudWindow + Acrylic EffectsBuilder) is implemented. Position is top-center with y=0. However, human testing confirmed overlay sits below notch, not blending with it. User feedback: prefers dark/black notch aesthetic over glassmorphic frosted glass. |
| 4 | Production-bundled builds maintain overlay invisibility and transparency on both platforms | VERIFIED (macOS only) | Production .app bundle exists at `src-tauri/target/release/bundle/macos/Steadi.app` and .dmg at `src-tauri/target/release/bundle/dmg/Steadi_0.1.0_aarch64.dmg`. Human confirmed overlay invisibility works in production build. Windows untested. |
| 5 | No network calls are made by the application at any point | VERIFIED | No fetch/axios/XMLHttpRequest/WebSocket in frontend code. No reqwest/hyper/networking crates in Rust code. Cargo.toml has only tauri, tauri-plugin-global-shortcut, serde, serde_json. CSP restricts to `default-src 'self'`. COMPATIBILITY-MATRIX.md confirms zero network calls observed. |

**Score:** 3/5 truths verified (1 FAILED, 1 PARTIAL)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src-tauri/src/overlay.rs` | Overlay window creation with content_protected, vibrancy, positioning | VERIFIED | 75 lines. Has `create_overlay` and `toggle_overlay`. Uses `content_protected(true)`, `EffectsBuilder` with HudWindow+Acrylic, `always_on_top(true)`, `transparent(true)`, `decorations(false)`. Position calculated from primary monitor. No stubs. |
| `src-tauri/src/lib.rs` | Tauri app builder with global shortcut plugin and overlay setup | VERIFIED | 41 lines. Registers `tauri_plugin_global_shortcut` with handler calling `overlay::toggle_overlay`. Setup closure registers Cmd+Shift+S shortcut and calls `overlay::create_overlay`. Exports `run()`. |
| `src-tauri/src/commands.rs` | IPC command handlers for overlay management | VERIFIED | 18 lines. `toggle_overlay` and `create_overlay` commands wrapping overlay module functions. Proper error mapping. |
| `src-tauri/src/main.rs` | Binary entry point | VERIFIED | 8 lines. Delegates to `steadi_lib::run()`. Has `windows_subsystem = "windows"` attribute. |
| `src-tauri/tauri.conf.json` | Main window config with macOSPrivateApi enabled | VERIFIED | `macOSPrivateApi: true` confirmed at line 12. CSP set. Main window configured. Overlay created dynamically from Rust. |
| `src-tauri/Cargo.toml` | Rust dependencies with macos-private-api feature | VERIFIED | `tauri` with `macos-private-api` feature. `tauri-plugin-global-shortcut` v2. `serde` and `serde_json`. |
| `vite.config.ts` | Multi-page build with main + overlay entry points | VERIFIED | 40 lines. `rollupOptions.input` with `main/index.html` and `overlay/index.html` (root-level paths after production build fix). React and Tailwind plugins. |
| `main/index.html` | Main window HTML entry | VERIFIED | Root-level. Script references `../src/main/main.tsx`. |
| `overlay/index.html` | Overlay HTML entry with transparent body | VERIFIED | Root-level. Inline style `html, body { background: transparent; margin: 0; overflow: hidden; }`. Script references `../src/overlay/main.tsx`. |
| `src/overlay/App.tsx` | Overlay teleprompter display with demo script | VERIFIED | 37 lines. Realistic quarterly review demo text. White text on transparent background. Center-aligned. Proper typography (text-lg, font-medium, leading-relaxed, drop-shadow-sm). |
| `src/main/App.tsx` | Main window with toggle controls | VERIFIED | 55 lines. Uses `invoke` from `@tauri-apps/api/core`. Toggle button calls `toggle_overlay`. Uses GlassPanel. Shows overlay visibility state. |
| `src/components/ui/GlassPanel.tsx` | Reusable glassmorphic container | VERIFIED | 33 lines. Exported named function. Accepts children, className, spread props. Uses rounded-xl, bg-white/5, backdrop-blur-sm, shadow-lg, border-white/10. |
| `src/styles/globals.css` | Transparent body styles | VERIFIED | Tailwind import + transparent body + overflow hidden + user-select none. |
| `src-tauri/capabilities/main-window.json` | Full permissions for main window | VERIFIED | core:default + global-shortcut permissions. Windows scope: ["main"]. |
| `src-tauri/capabilities/overlay-window.json` | Minimal permissions for overlay | VERIFIED | core:default only. Windows scope: ["overlay"]. |
| `src-tauri/target/release/bundle/macos/Steadi.app` | Production macOS build | VERIFIED | .app bundle exists. |
| `src-tauri/target/release/bundle/dmg/Steadi_0.1.0_aarch64.dmg` | Production DMG installer | VERIFIED | DMG exists (2.88MB). |
| `COMPATIBILITY-MATRIX.md` | Screen share test results | VERIFIED | Documents Zoom, Meet, web recorders as PASS. Windows documented as untested. Assessment section with GO decision. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib.rs` | `overlay.rs` | `overlay::create_overlay` in setup closure | WIRED | Line 34: `overlay::create_overlay(app.handle())?;` called in `.setup()`. |
| `lib.rs` | `overlay.rs` | `overlay::toggle_overlay` in shortcut handler | WIRED | Line 16: `overlay::toggle_overlay(app).ok();` called in global shortcut handler. |
| `lib.rs` | `tauri-plugin-global-shortcut` | Plugin registration + shortcut | WIRED | Lines 13-19: Plugin built and registered. Line 27-31: Shortcut registered with SUPER+SHIFT+KeyS. |
| `lib.rs` | `commands.rs` | `generate_handler!` macro | WIRED | Lines 21-24: `commands::toggle_overlay` and `commands::create_overlay` registered. |
| `commands.rs` | `overlay.rs` | `crate::overlay` import | WIRED | Line 6: `use crate::overlay;`. Functions delegate to overlay module. |
| `main/App.tsx` | `@tauri-apps/api/core` | `invoke('toggle_overlay')` | WIRED | Line 5: import invoke. Line 12: `invoke<boolean>("toggle_overlay")` called with typed response. |
| `main/App.tsx` | `GlassPanel.tsx` | Import and JSX usage | WIRED | Line 6: import. Line 18: `<GlassPanel>` wrapping content. |
| `vite.config.ts` | `main/index.html`, `overlay/index.html` | `rollupOptions.input` | WIRED | Lines 34-37: Both entries in rollupOptions.input. |
| `main/index.html` | `src/main/main.tsx` | Script tag | WIRED | `<script type="module" src="../src/main/main.tsx">` |
| `overlay/index.html` | `src/overlay/main.tsx` | Script tag | WIRED | `<script type="module" src="../src/overlay/main.tsx">` |
| `src/main/main.tsx` | `src/main/App.tsx` | Import + render | WIRED | `import MainApp from "./App"` then `<MainApp />` in createRoot.render. |
| `src/overlay/main.tsx` | `src/overlay/App.tsx` | Import + render | WIRED | `import OverlayApp from "./App"` then `<OverlayApp />` in createRoot.render. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| PLAT-01: Overlay invisible to Zoom on macOS | SATISFIED | Human verified: PASS |
| PLAT-02: Overlay invisible to Teams on macOS | NEEDS HUMAN | Teams not tested (not installed). Only Zoom and Meet tested. |
| PLAT-03: Overlay invisible to Meet on macOS | SATISFIED | Human verified: PASS |
| PLAT-04: Overlay invisible to OBS on macOS | NEEDS HUMAN | OBS not tested. Only Zoom, Meet, and web recorders tested. |
| PLAT-05: Overlay invisible to Zoom on Windows | BLOCKED | No Windows testing performed |
| PLAT-06: Overlay invisible to Teams on Windows | BLOCKED | No Windows testing performed |
| PLAT-07: Overlay invisible to Meet on Windows | BLOCKED | No Windows testing performed |
| PLAT-08: Overlay invisible to OBS on Windows | BLOCKED | No Windows testing performed |
| PLAT-09: Zero network calls | SATISFIED | No networking code in frontend or backend. CSP restricts to self. |
| OVRL-01: Always-on-top transparent window near top-center | PARTIAL | Implemented and working but design feedback: sits below notch, glassmorphic doesn't match desired dark aesthetic |
| DSGN-01: Glassmorphic design language | SATISFIED | GlassPanel component, native vibrancy effects, frosted glass styling throughout |
| DSGN-02: Native vibrancy APIs | SATISFIED | EffectsBuilder with HudWindow (macOS) and Acrylic (Windows). Not CSS-based blur. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No TODO, FIXME, placeholder, stub, or empty implementation patterns found in any source file |

### Human Verification Required

### 1. Microsoft Teams Screen Share (macOS)
**Test:** Launch production Steadi.app, open Teams, start a screen share, check if overlay appears in shared output.
**Expected:** Overlay should be invisible in the Teams shared output.
**Why human:** Requires Teams installed and a call/meeting to share screen.

### 2. OBS Display Capture (macOS)
**Test:** Launch production Steadi.app, open OBS, add Display Capture source, check if overlay appears in capture preview.
**Expected:** Overlay should be invisible in OBS capture.
**Why human:** Requires OBS installed. OBS may use ScreenCaptureKit on macOS 15+ which research flagged as highest risk for bypassing content_protected.

### 3. Windows Full Platform Validation
**Test:** Install Steadi on Windows, verify: (a) overlay transparency works, (b) Acrylic vibrancy active, (c) overlay invisible in Zoom/Teams/Meet/OBS screen shares, (d) Ctrl+Shift+S toggle works, (e) production build maintains all of the above.
**Expected:** Same behavior as macOS -- invisible overlay with native vibrancy.
**Why human:** Requires Windows machine. Research flagged potential WebView2 + SetWindowDisplayAffinity COMException conflict.

### 4. Visual Design Review
**Test:** Launch Steadi, evaluate overlay positioning relative to MacBook notch and overall aesthetic.
**Expected:** Per user feedback, overlay should blend with notch (dark/black, not frosted glass).
**Why human:** Subjective design evaluation. User already provided feedback that current style doesn't match desired direction.

### Gaps Summary

Two gaps prevent full phase goal achievement:

**Gap 1: Windows platform entirely untested.** The phase goal explicitly states "proven to work on both macOS and Windows." The code includes Windows-targeted APIs (Effect::Acrylic for vibrancy, content_protected which maps to SetWindowDisplayAffinity on Windows), and the architectural approach is sound based on research. However, zero empirical testing has been performed. The COMPATIBILITY-MATRIX.md honestly documents this as "Not Yet Tested." The research phase flagged a specific risk: WebView2 transparent windows may throw COMException when SetWindowDisplayAffinity is called. This cannot be verified without a Windows machine.

**Gap 2: Overlay design/positioning feedback from human tester.** The overlay works functionally (transparency, vibrancy, content protection), but user testing revealed that (a) the overlay sits below the notch rather than blending with it, and (b) the glassmorphic frosted-glass aesthetic doesn't match the user's desired dark/black notch-style look. The 01-03-SUMMARY.md captured this as "design refinement for Phase 3" which is a reasonable deferral -- the OVRL-01 requirement says "near top-center of screen (notch-style default)" and the current implementation is near top-center. The design mismatch is a preference issue, not a broken requirement. Marking as PARTIAL rather than FAILED.

**Assessment:** The macOS validation is strong -- 3 screen sharing apps tested and passed, code is clean with no stubs, all wiring is solid. The Windows gap is the primary blocker for full phase completion. The design feedback is noted but deferrable.

---

_Verified: 2026-02-15T20:04:17Z_
_Verifier: Claude (gsd-verifier)_
