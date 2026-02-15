# PRD: Steadi — Cross-Platform Invisible Teleprompter

> 🎯 Stay steady on camera. A cross-platform invisible teleprompter with voice-synced scrolling that's hidden from Zoom, Teams, Meet, and OBS.

## What We're Building

A desktop teleprompter app for **macOS and Windows** that displays a script overlay near the user's webcam, scrolls text in sync with their voice, and remains **completely invisible during screen sharing** on Zoom, Teams, Meet, OBS, etc.

Think of it as an open-source, cross-platform, improved version of [Notchie](https://www.notchie.app/) — a Mac-only teleprompter that hides in the MacBook notch.

## Why It Matters

Remote professionals (salespeople, presenters, content creators, educators) need to read scripts while maintaining eye contact on camera. Current solutions are either Mac-only, visible during screen share, or scroll at a fixed speed that forces robotic delivery.

## Core Features (MVP)

### 1. Invisible Overlay Window
- Always-on-top transparent window positioned near the top-center of the screen (where webcams sit)
- **Must be invisible to all screen-capture tools** (Zoom, Teams, Meet, OBS)
  - macOS: use `NSWindow.sharingType = .none`
  - Windows: use `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`
- Draggable and resizable — user can reposition freely
- Adjustable font size, opacity, and background color

### 2. Voice-Synced Scrolling
- Text scrolls automatically based on the user's speech — pauses when they pause, speeds up when they speed up
- **Platform-specific implementations behind a unified adapter interface:**
  - **macOS**: Use Apple's native `SFSpeechRecognizer` (on-device STT) for **word-level script tracking** — the overlay jumps to the exact position in the script matching what the user just said
  - **Windows**: Use Silero VAD (voice activity detection) via ONNX Runtime for **cadence-based scrolling** — scroll speed proportional to voice intensity, pause on silence
- The adapter pattern ensures the scroll controller doesn't know or care which platform it's on. It consumes a common event type from either adapter.
- Adjustable microphone sensitivity

### 3. Manual Controls
- Keyboard shortcuts for: scroll speed adjustment, manual scroll up/down, play/pause, toggle visibility
- Hover-to-pause: mouse over the overlay freezes scrolling instantly
- Classic auto-scroll mode (fixed speed) as a fallback

### 4. Script Management
- Paste or type a script into a simple editor
- Import from .txt or .md files
- Save/load multiple scripts locally
- Markdown rendering in the overlay (bold for emphasis, headers for sections)

## Design Language

The UI must follow a **minimalist glassmorphic** aesthetic:

- Frosted glass backgrounds with backdrop blur and subtle transparency
- Soft, diffused borders with low-opacity white/light strokes
- Muted, restrained color palette — no harsh colors, no heavy gradients
- Depth through layered translucency rather than drop shadows
- Clean sans-serif typography with generous spacing
- Minimal chrome — controls appear on hover or via keyboard, staying out of the way
- The overlay itself should feel like it barely exists — a gentle frosted strip the user can read through
- Settings and script editor panels should use the same glass-panel treatment, floating and elegant
- Light and dark mode support, both maintaining the glassmorphic feel

The design should feel premium, calm, and invisible — matching the product's core promise.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Tauri 2** (Rust backend + web frontend) |
| Frontend | React + Tailwind CSS + Zustand |
| macOS speech | Apple `SFSpeechRecognizer` via `objc2` crate |
| Windows speech | `cpal` (audio capture) + Silero VAD via `ort` crate |
| Screen-hide | Native APIs per platform (see above) |
| Storage | Local SQLite or JSON via `serde` |

## Architecture Principles

1. **Adapter pattern for speech detection** — A Rust trait `SpeechScrollAdapter` with platform-specific implementations. The macOS adapter emits precise word-position events; the Windows adapter emits scroll-speed/pause events. The `ScrollController` handles both.

2. **Frontend knows nothing about platform** — The React UI communicates with Rust via Tauri IPC commands. All platform-specific logic lives in Rust.

3. **Privacy-first** — All speech processing is on-device. No network calls, no accounts, no telemetry. Scripts are stored locally only.

4. **App Store ready from day one** — The architecture, sandboxing, code signing, entitlements, and packaging must be structured from the start to support distribution via the **Mac App Store** and **Microsoft Store**. This means:
   - Proper app sandboxing (macOS App Sandbox, Windows AppContainer)
   - No hardcoded paths outside permitted directories — use platform-standard app data locations
   - All entitlements (microphone access, speech recognition) declared upfront
   - No private/undocumented API usage — only public, app-review-safe APIs
   - Tauri's bundler configuration set up for store-compliant signing and packaging from the first build
   - Clean separation of app logic from distribution concerns so that GitHub releases and store builds coexist without forking

## What's NOT in MVP

- Linux support
- Cloud sync or accounts
- AI script generation
- Multi-language voice detection (English-first, expand later)

## Success Criteria

- Overlay is confirmed invisible on Zoom, Teams, Meet, and OBS on both macOS and Windows
- Voice-synced scrolling responds within ~200ms of speech changes
- macOS word-level tracking correctly follows the script position
- App launches in under 2 seconds, uses under 100MB RAM during operation
- Bundle size under 30MB per platform
- Builds pass Mac App Store and Microsoft Store submission requirements

## Distribution

Open-source (MIT license). Primary distribution via **Mac App Store** and **Microsoft Store**. Secondary distribution via GitHub releases, Homebrew tap (macOS), and Winget (Windows).