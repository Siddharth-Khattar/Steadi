# Compatibility Matrix: Overlay Screen Share Invisibility

## Test Environment

- **Test Date:** 2026-02-15
- **Platform:** macOS (MacBook with notch)
- **Build Type:** Production (.app bundle via `cargo tauri build`)
- **Overlay API:** `content_protected(true)` -> `NSWindow.sharingType = .none`

## Screen Share Test Results

| App | Share Mode | Overlay Visible? | Result | Notes |
|-----|-----------|-----------------|--------|-------|
| Zoom | Share Screen | No | PASS | Invisible in shared output |
| Google Meet | Share Screen | No | PASS | Invisible in shared output |
| Web recorders | Screen capture | No | PASS | Unable to detect overlay rectangle |

### Toggle Shortcut (Cmd+Shift+S)

| Test | Result |
|------|--------|
| Toggle overlay off during screen share | Working |
| Toggle overlay on during screen share | Working |

## Platforms Not Yet Tested

| Platform | Reason | Priority |
|----------|--------|----------|
| Windows | No Windows machine available | Test in Phase 2+ when Windows dev environment is set up |
| macOS 15+ ScreenCaptureKit bypass | Requires targeted testing with ScreenCaptureKit-based recorders | Monitor -- research flagged this as highest risk |

## Summary of Findings

### What works
- **Core invisibility is validated.** The `content_protected(true)` API successfully hides the overlay from Zoom, Google Meet, and web-based screen recorders on macOS.
- **All tested screen sharing modes** (full screen share) show the overlay as completely invisible -- not partially visible, not a black rectangle, but genuinely absent from the shared output.
- **Toggle shortcut** works reliably during active screen shares.

### What needs further testing
- **Windows:** `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` is the Windows equivalent. Research flagged potential COMException conflicts with WebView2 transparent windows. Must be tested when a Windows machine is available.
- **macOS 15+ ScreenCaptureKit:** Research identified that ScreenCaptureKit may ignore `NSWindow.sharingType = .none`. The tested apps (Zoom, Meet) may use older screen capture APIs. Apps using ScreenCaptureKit directly could potentially capture the overlay.

### Known limitation
- **"Share Window" mode** was not tested (only "Share Screen" mode). Share Window typically captures a specific window's content, which should not include the overlay since it is a separate window, but this should be verified.

## Visual Quality Notes

- Text was legible and comfortable to read
- Overlay positioned at top-center of screen as designed
- User feedback: overlay should blend with MacBook notch (dark/black background rather than glassmorphic/frosted) to feel native to the notch area. On Windows, a dark rectangle flush with the top edge. This is a design refinement for future phases -- does not affect invisibility validation.

## Assessment

### Go/No-Go for Phase 2

**GO.** The core value proposition is validated on macOS.

**Confidence level: High** for macOS with standard screen sharing tools (Zoom, Meet, web recorders).

**Confidence level: Medium** overall, with two caveats:
1. Windows testing is deferred (no machine available), but the Windows API (`SetWindowDisplayAffinity`) is well-documented and widely used for similar purposes.
2. macOS 15+ ScreenCaptureKit bypass is a known risk from research. The tested apps did not exhibit this behavior, but it remains a concern for ScreenCaptureKit-native capture tools.

### Implications for the project
- **Proceed to Phase 2** -- the invisibility approach works with the most common screen sharing tools.
- **Windows validation** should be prioritized when a Windows dev environment becomes available (could be an inserted phase 1.1 if needed).
- **ScreenCaptureKit workaround** should be investigated if/when a specific app is found to bypass `sharingType = .none`. The research documented potential mitigation strategies (CGWindowID exclusion, observer-based workarounds).
- **Design refinement** (notch-blending dark style) is noted for Phase 3 overlay polish, not a Phase 1 concern.

---
*Phase: 01-platform-validation-spike*
*Tested: 2026-02-15*
