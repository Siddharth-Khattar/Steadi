# Steadi

## What This Is

A cross-platform invisible teleprompter for macOS and Windows. Steadi combines a glassmorphic notes-style script editor with a teleprompter overlay that hides from screen sharing (Zoom, Teams, Meet, OBS). On macOS, it does word-level script tracking with auto-highlighting via native speech recognition. On Windows, it uses voice-activity-based cadence scrolling. Built with Tauri 2 (Rust + React), fully on-device, no accounts or cloud.

## Core Value

The teleprompter overlay must be completely invisible during screen sharing while scrolling in sync with the user's voice — this is the one thing that makes Steadi worth using.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Invisible overlay window that hides from all screen-capture tools (Zoom, Teams, Meet, OBS)
- [ ] Voice-synced scrolling — scroll speed follows speech cadence, pauses on silence
- [ ] macOS: word-level script tracking via SFSpeechRecognizer with auto-highlighting of current position
- [ ] Windows: cadence-based scrolling via Silero VAD (voice activity detection)
- [ ] Rewind-to-sentence hotkey — each press steps back one sentence in the script
- [ ] Notes-app-style script editor with left sidebar file/folder tree
- [ ] Raw markdown editor with toggleable right-side rendered preview (default 50%, resizable)
- [ ] Top-right controls to launch teleprompter overlay and access settings
- [ ] Teleprompter starts for the currently opened file when "start" is clicked
- [ ] Overlay positioned near webcam by default (notch-style), draggable, position persisted
- [ ] Manual scroll controls via keyboard shortcuts (speed adjust, scroll up/down, play/pause, toggle visibility)
- [ ] Hover-to-pause — mouse over overlay freezes scrolling
- [ ] Classic auto-scroll mode (fixed speed) as fallback
- [ ] Markdown rendering in the overlay (bold, headers, emphasis)
- [ ] Save/load scripts locally with file/folder organization
- [ ] Adjustable microphone sensitivity
- [ ] Glassmorphic design language throughout — frosted glass, backdrop blur, translucency
- [ ] Light and dark mode, both maintaining glassmorphic aesthetic
- [ ] All speech processing on-device — no network calls, no telemetry
- [ ] Cross-platform: macOS and Windows

### Out of Scope

- Linux support — macOS and Windows only for v1
- Cloud sync or accounts — fully local, no network
- AI script generation — not a writing tool
- Multi-language voice detection — English-first
- Import/export from files — paste or type scripts directly
- Adjustable font size, opacity, background color in overlay — defer to post-v1
- App Store / Microsoft Store submission — architect for it, but ship via GitHub releases first

## Context

- Inspired by [Notchie](https://www.notchie.app/) — a Mac-only teleprompter that hides in the MacBook notch. Steadi is cross-platform and open-source.
- Target users: remote sales professionals, presenters, content creators, educators — anyone who reads scripts while on camera.
- The adapter pattern is key: a Rust trait `SpeechScrollAdapter` with platform-specific implementations. macOS emits word-position events; Windows emits scroll-speed/pause events. The `ScrollController` consumes both through a common interface.
- Privacy is a selling point — all processing on-device, no data leaves the machine.
- Open-source under MIT license.

## Constraints

- **Tech stack**: Tauri 2 (Rust backend + React/Tailwind/Zustand frontend) — non-negotiable
- **macOS speech**: Apple `SFSpeechRecognizer` via `objc2` crate — on-device only
- **Windows speech**: `cpal` (audio capture) + Silero VAD via `ort` crate (ONNX Runtime)
- **Screen-hide macOS**: `NSWindow.sharingType = .none`
- **Screen-hide Windows**: `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`
- **Performance**: Launch under 2 seconds, under 100MB RAM, bundle under 30MB per platform
- **Privacy**: Zero network calls, zero telemetry, zero accounts
- **Store-readiness**: No private APIs, no hardcoded paths, platform-standard app data locations, proper entitlements declared — but actual store submission is deferred
- **Design**: Glassmorphic aesthetic is firm — frosted glass panels, blur, translucency throughout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Unified scrolling behavior with rewind-to-sentence hotkey | Simpler than script-matching for off-script recovery. Teleprompter keeps scrolling; user presses hotkey to step back one sentence at a time. | — Pending |
| macOS gets word-level tracking, Windows gets VAD-only | SFSpeechRecognizer enables premium macOS experience. Windows lacks equivalent on-device STT, so cadence-based scrolling is the pragmatic choice. | — Pending |
| Architect for App Store, ship via GitHub first | Store submission adds overhead (signing, sandboxing, review). Defer the bureaucracy, but don't make choices that close the door. | — Pending |
| Glassmorphic design throughout | Firm brand identity — frosted glass panels for editor, sidebar, overlay, settings. Premium, calm, invisible. | — Pending |
| Raw markdown editor with toggleable preview | No WYSIWYG complexity. Write in markdown, toggle a rendered preview panel on the right. Overlay renders the markdown when teleprompter starts. | — Pending |

---
*Last updated: 2026-02-15 after initialization*
