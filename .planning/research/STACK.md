# Stack Research

**Domain:** Cross-platform invisible teleprompter desktop app (macOS + Windows)
**Researched:** 2026-02-15
**Confidence:** HIGH (core framework decisions verified; some crate versions are MEDIUM due to WebFetch unavailability)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri 2 | 2.10.x | Desktop app framework (Rust backend + web frontend) | Only serious Electron alternative with native Rust backend. Sub-30MB bundles (vs 150MB+ Electron). Direct access to native APIs via Rust. Built-in App Store distribution support. |
| React | 19.2.x | UI framework | Mature ecosystem, excellent TypeScript support, huge component library availability. Tauri's `create-tauri-app` has first-class React template. |
| TypeScript | 5.9.x | Type safety for frontend | Non-negotiable for any production app. Catches entire categories of bugs at compile time. |
| Vite | 7.x | Frontend build tool | Default bundler for Tauri 2 + React projects. HMR in <50ms. Native TypeScript support. |
| Tailwind CSS | 4.x | Utility-first CSS framework | Ideal for glassmorphic UI -- native `backdrop-blur`, `bg-opacity`, `border-opacity` utilities. v4 is 5x faster builds, zero-config. |
| Zustand | 5.0.x | Frontend state management | ~1KB, hook-based, zero boilerplate. Ideal for managing teleprompter state (scroll position, speech events, script data) without Redux overhead. Built-in persist middleware for settings. |
| Rust | stable (1.84+) | Backend language | Required by Tauri. Provides safe native API access, zero-cost abstractions, and cross-compilation. |

### Platform-Specific: macOS Speech Recognition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| objc2 | 0.6.x | Core Objective-C runtime bindings | Safe Rust bindings to Apple frameworks. Actively maintained, generated from Xcode 16.4 SDKs. The standard for Apple framework access from Rust. |
| objc2-speech | latest (aligned with objc2) | SFSpeechRecognizer bindings | Provides typed Rust access to Apple's on-device speech recognition. Word-level timestamps enable script position tracking. |
| objc2-app-kit | latest (aligned with objc2) | NSWindow / AppKit bindings | Required for `NSWindow.setSharingType(.none)` to make overlay invisible to screen capture. Also needed for window-level manipulation. |
| objc2-foundation | latest (aligned with objc2) | Foundation framework bindings | Base types (NSString, NSArray, etc.) required by speech and app-kit crates. |

### Platform-Specific: Windows Speech / Audio

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| cpal | 0.16.x+ | Cross-platform audio I/O | Pure Rust, battle-tested (8.7M+ downloads). Provides low-level audio input capture for feeding into VAD. Supports WASAPI on Windows. |
| ort | 2.0.0-rc.11 | ONNX Runtime for Rust | The Rust gateway to ONNX Runtime. Runs Silero VAD model with high performance. Used in production by Google Magika, SurrealDB, Bloop. |
| Silero VAD v6.2 | ONNX model | Voice Activity Detection | MIT-licensed, no telemetry, no keys. Trained on 6000+ languages. ~1MB ONNX model, runs 4-5x faster via ONNX than PyTorch. 8kHz and 16kHz support. |
| windows (windows-rs) | 0.62.x | Windows API bindings | Microsoft's official Rust bindings. Provides `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` for invisible windows. Preferred over legacy `winapi` crate. |

### Window Effects (Glassmorphic UI)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri built-in window effects | (part of tauri 2.x) | Native blur/vibrancy/mica | Tauri 2 absorbed the `window-vibrancy` library. Provides `apply_vibrancy` (macOS), `apply_mica`/`apply_acrylic` (Windows) directly through the window builder API. |
| window-vibrancy (standalone) | 0.7.x | Fallback for advanced effects | Only needed if Tauri's built-in effects prove insufficient. Same codebase, maintained by Tauri team. |

**CRITICAL NOTE on glassmorphic UI:** CSS `backdrop-filter: blur()` does NOT work properly on Tauri transparent windows. The blur only affects content within the app, not the desktop behind it. For true frosted-glass effect over the desktop, you MUST use native platform vibrancy APIs (NSVisualEffectView on macOS, Mica/Acrylic on Windows) via Tauri's built-in effects, then layer semi-transparent CSS on top. This is a well-documented issue (tauri-apps/tauri#12804, #12437, #6876).

### Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| tauri-plugin-store | 2.4.x | Persistent key-value settings | Official Tauri plugin. JSON-backed, survives app restarts. Ideal for user preferences (font size, opacity, window position, mic sensitivity). |
| tauri-plugin-sql (sqlite feature) | 2.3.x | SQLite for scripts database | Official Tauri plugin wrapping sqlx. Proper relational storage for scripts with metadata (title, created_at, last_used). Supports migrations. |
| serde + serde_json | 1.x | Rust serialization | De facto standard for Rust serialization. Required for IPC between Rust and frontend, config file handling. |

### Markdown Rendering / Editing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-markdown | 10.x | Markdown-to-React renderer | For the overlay display. Lightweight, extensible via remark/rehype plugins. Renders bold, headers, emphasis -- exactly what the teleprompter needs. |
| @uiw/react-codemirror | 4.x (CM6) | Markdown editor component | For the script editor. CodeMirror 6 under the hood -- fast, accessible, extensible. Syntax highlighting for markdown. |
| @codemirror/lang-markdown | 6.5.x | Markdown language support | CodeMirror 6 plugin for markdown syntax. Required companion to react-codemirror. |

### Tauri Official Plugins

| Plugin | Version | Purpose | Why Recommended |
|--------|---------|---------|-----------------|
| tauri-plugin-global-shortcut | 2.x | System-wide keyboard shortcuts | For play/pause, scroll speed, toggle visibility. Official plugin, works when app is not focused. |
| tauri-plugin-fs | 2.4.x | File system access | For importing .txt/.md script files. Sandboxed access with configurable permissions. |
| tauri-plugin-store | 2.4.x | Persistent KV store | User settings persistence (see Storage section). |
| tauri-plugin-sql | 2.3.x | SQLite database | Script storage (see Storage section). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Tauri CLI (tauri-cli) | 2.10.x | Build, dev, bundle Tauri apps | Install via `cargo install tauri-cli` or use `@tauri-apps/cli` npm package |
| ESLint + Prettier | Latest | Linting and formatting | Standard for React/TS projects |
| Biome | 1.x | Alternative to ESLint+Prettier | Faster, single tool. Consider if starting fresh. |
| cargo-watch | Latest | Auto-rebuild Rust on changes | Speeds up Rust backend development |
| cross (optional) | Latest | Cross-compilation | If building Windows targets from macOS or vice versa |

## Installation

```bash
# Create Tauri 2 project with React + TypeScript
npm create tauri-app@latest steadi -- --template react-ts

# Frontend dependencies
npm install zustand react-markdown @uiw/react-codemirror @codemirror/lang-markdown @codemirror/language-data
npm install @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-fs @tauri-apps/plugin-store @tauri-apps/plugin-sql

# Dev dependencies
npm install -D @tauri-apps/cli typescript @types/react @types/react-dom
# Tailwind CSS v4 (auto-detected, just import in CSS)
npm install tailwindcss @tailwindcss/vite
```

```toml
# Cargo.toml (src-tauri/Cargo.toml) - Core dependencies
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-fs = "2"
tauri-plugin-store = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# macOS-only speech recognition
[target.'cfg(target_os = "macos")'.dependencies]
objc2 = "0.6"
objc2-speech = { version = "0.3", features = ["SFSpeechRecognizer", "SFSpeechRecognitionTask", "SFSpeechRecognitionResult", "SFTranscriptionSegment"] }
objc2-app-kit = { version = "0.3", features = ["NSWindow", "NSRunningApplication"] }
objc2-foundation = { version = "0.3", features = ["NSString", "NSArray"] }

# Windows-only audio + VAD
[target.'cfg(target_os = "windows")'.dependencies]
cpal = "0.16"
ort = "2.0.0-rc.11"
windows = { version = "0.62", features = ["Win32_UI_WindowsAndMessaging"] }
```

**NOTE on objc2 versions:** The objc2 framework crates (objc2-speech, objc2-app-kit, objc2-foundation) follow their own versioning but must be from the same release generation. Check crates.io for the latest aligned versions at project init time. The versions above (0.3.x) are approximate -- verify with `cargo search objc2-speech` before committing to Cargo.toml. **Confidence: MEDIUM** -- could not verify exact latest version due to tool limitations.

**NOTE on ort version:** ort 2.0.0-rc.11 is a release candidate, not a stable release. The API is production-ready but may have minor breaking changes before 2.0.0 stable. Pin to the exact RC version and monitor for stable release. **Confidence: MEDIUM**.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Tauri 2 | Electron | Never for this project. Electron bundles entire Chromium (150MB+), cannot access native APIs like SFSpeechRecognizer directly. |
| Tauri 2 | Wails (Go) | If the team has Go expertise and does not need Apple native framework access. Wails lacks the native API depth Tauri + Rust provides. |
| React | SolidJS | If bundle size is paramount and team knows SolidJS. SolidJS is ~7KB vs React ~45KB. But React's ecosystem (CodeMirror wrappers, markdown renderers) is vastly larger. |
| React | Svelte | If the team prefers Svelte. Good Tauri support. Smaller bundle. But fewer pre-built components for editors/markdown. |
| Zustand | Jotai | If atomic state model is preferred. Jotai is from the same team (pmndrs). Choose Zustand for store-based patterns, Jotai for atomic. |
| Zustand | Redux Toolkit | If the app grows very complex with many async flows. Overkill for Steadi's scope. |
| tauri-plugin-sql (SQLite) | serde JSON files | For simpler projects with <20 scripts. JSON via serde is lighter but lacks queries, migrations, and concurrent-access safety. |
| tauri-plugin-sql (SQLite) | tauri-plugin-store (for everything) | If scripts are small and few. Store plugin is KV-only, no relational queries. Not suitable for script search/sort/filter. |
| CodeMirror 6 | MDXEditor | If you want a WYSIWYG markdown experience (Notion-like). Heavier, but richer editing UX. Consider if users find raw markdown intimidating. |
| CodeMirror 6 | textarea + react-markdown | For absolute simplicity. No syntax highlighting, but zero dependencies. Viable for MVP. |
| ort (ONNX Runtime) | whisper.cpp via Rust bindings | If you want STT on Windows too (not just VAD). Much heavier (~75MB model), but gives word-level transcription on both platforms. |
| cpal | rodio | If you need audio playback (rodio wraps cpal). For capture-only (our case), use cpal directly. |
| windows-rs | winapi | Never for new projects. winapi is unmaintained. windows-rs is Microsoft's official replacement. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Electron | 150MB+ bundles, no native API access, massive RAM overhead | Tauri 2 |
| winapi crate | Unmaintained (last real update ~2021). Missing newer Windows APIs. | `windows` crate (Microsoft official) |
| CSS `backdrop-filter: blur()` for desktop frosted glass | Does not blur content behind the Tauri window -- only blurs content within the webview. This is a fundamental limitation, not a bug. | Native vibrancy APIs via Tauri's built-in window effects |
| Node.js addon for speech | Adds native compilation complexity, breaks Tauri's clean architecture | Rust-side speech processing via objc2/cpal+ort |
| Web Speech API | Requires internet connection, poor accuracy, no word-level timestamps | Native SFSpeechRecognizer (macOS) + Silero VAD (Windows) |
| onnxruntime crate (nbigaouette) | Abandoned since 2021, pinned to ONNX Runtime 1.8 | `ort` crate (pyke.io) -- active, supports latest ONNX Runtime |
| React Context for global state | Fine for theme/locale, terrible for frequently-updating state like scroll position. Causes unnecessary re-renders. | Zustand with selectors |
| Tailwind CSS v3 | v4 is a complete rewrite with 5x faster builds, zero-config, CSS-native design tokens. No reason to use v3 for new projects. | Tailwind CSS v4 |
| Redux / MobX | Massive overkill for this app's state complexity. Zustand does everything needed in 1KB. | Zustand |

## Stack Patterns by Variant

**If you need word-level transcription on Windows (future):**
- Add `whisper.cpp` Rust bindings alongside Silero VAD
- Use Silero VAD for fast voice/silence detection, whisper.cpp for periodic word extraction
- This would let the Windows adapter emit word-position events like macOS
- Bundle size increases by ~75MB (quantized model)

**If App Store reviewers reject due to microphone usage patterns:**
- Ensure entitlements declare `com.apple.security.device.audio-input` and `com.apple.security.device.microphone`
- Add clear NSMicrophoneUsageDescription explaining on-device-only speech processing
- Windows Store: declare microphone capability in AppxManifest

**If overlay transparency causes performance issues:**
- Reduce vibrancy effect to simpler variant (e.g., `.sidebar` instead of `.fullScreenUI` on macOS)
- Use `apply_blur` instead of `apply_acrylic` on Windows (acrylic has known perf issues during resize/drag)
- Fall back to solid semi-transparent background with no native blur

**If bundle size exceeds 30MB target (Windows):**
- Silero VAD v6.2 ONNX model is ~1-2MB
- ONNX Runtime shared library is ~15-20MB -- this is the main culprit
- Options: Use `ort` feature flags to strip unused execution providers, or statically link with LTO
- Alternatively: ship ONNX Runtime as a sidecar downloaded on first launch

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| tauri 2.10.x | @tauri-apps/api 2.10.x | Must match major.minor between Rust and JS packages |
| tauri 2.10.x | tauri-plugin-* 2.x | Plugins follow Tauri 2 major version |
| objc2 0.6.x | objc2-speech/app-kit/foundation 0.3.x | Framework crates have their own version; must be from same generation. Check compatibility in objc2 repo. |
| ort 2.0.0-rc.11 | ONNX Runtime 1.20.x | ort bundles or links the correct ONNX Runtime version automatically |
| cpal 0.16.x | Rust stable 1.70+ | Minimum MSRV for cpal |
| React 19.2.x | Zustand 5.x | Zustand 5 has full React 19 compatibility |
| React 19.2.x | @uiw/react-codemirror 4.x | Verified compatible with React 18+/19 |
| Tailwind CSS 4.x | Vite 7.x | Use `@tailwindcss/vite` plugin for zero-config integration |
| TypeScript 5.9.x | Vite 7.x | Native TypeScript support in Vite |

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|------------|-------|
| Tauri 2.10.x | HIGH | Version confirmed via docs.rs and GitHub releases |
| React 19.2.x | HIGH | Version confirmed via react.dev blog and npm |
| Tailwind CSS 4.x | HIGH | Confirmed v4.0-4.1 via official blog. Exact latest patch unclear. |
| Zustand 5.0.x | HIGH | Version confirmed via npm and GitHub releases |
| Vite 7.x | HIGH | Confirmed via official releases page and npm |
| TypeScript 5.9.x | HIGH | Confirmed via microsoft/TypeScript releases |
| objc2 ecosystem | MEDIUM | Core version 0.6.x confirmed. Framework crate exact versions (objc2-speech, objc2-app-kit) could not be precisely verified -- need `cargo search` at init time. |
| ort 2.0.0-rc.11 | MEDIUM | RC version confirmed via crates.io/docs.rs. Stable 2.0 not yet released. Production-ready per maintainers. |
| cpal 0.16.x | MEDIUM | Docs.rs shows 0.16.0. One search result hinted at 0.17.1 -- verify with `cargo search cpal` at init time. |
| windows-rs 0.62.x | MEDIUM | Version confirmed via GitHub releases. Exact latest patch not verified. |
| Silero VAD v6.2 | HIGH | Confirmed via GitHub releases (2025-12-10) |
| window-vibrancy (built-in) | MEDIUM | Confirmed absorbed into Tauri 2. Exact API surface for built-in effects needs verification against Tauri docs at dev time. |

## Sources

- [Tauri 2 official docs](https://v2.tauri.app/) -- framework capabilities, plugins, distribution
- [Tauri 2.10.2 on docs.rs](https://docs.rs/crate/tauri/latest) -- latest crate version
- [Tauri GitHub releases](https://github.com/tauri-apps/tauri/releases) -- version history
- [React 19.2 announcement](https://react.dev/blog/2025/10/01/react-19-2) -- React version
- [Tailwind CSS v4.0 blog](https://tailwindcss.com/blog/tailwindcss-v4) -- Tailwind v4 features
- [Zustand GitHub](https://github.com/pmndrs/zustand) -- version 5.0.x
- [Vite releases](https://vite.dev/releases) -- Vite 7.x
- [TypeScript releases](https://github.com/microsoft/typescript/releases) -- TS 5.9.x
- [objc2 GitHub](https://github.com/madsmtm/objc2) -- Apple framework bindings
- [objc2-speech on docs.rs](https://docs.rs/objc2-speech/latest/objc2_speech/struct.SFSpeechRecognizer.html) -- SFSpeechRecognizer API
- [objc2-app-kit NSWindow on docs.rs](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSWindow.html) -- NSWindow.sharingType
- [ort on pyke.io](https://ort.pyke.io/) -- ONNX Runtime Rust crate
- [ort on crates.io](https://crates.io/crates/ort) -- version 2.0.0-rc.11
- [cpal GitHub](https://github.com/RustAudio/cpal) -- audio I/O crate
- [Silero VAD GitHub](https://github.com/snakers4/silero-vad) -- VAD model v6.2
- [windows-rs GitHub](https://github.com/microsoft/windows-rs) -- Microsoft Rust bindings
- [SetWindowDisplayAffinity docs](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowdisplayaffinity) -- WDA_EXCLUDEFROMCAPTURE
- [WDA_EXCLUDEFROMCAPTURE in windows-rs](https://microsoft.github.io/windows-docs-rs/doc/windows/Win32/UI/WindowsAndMessaging/constant.WDA_EXCLUDEFROMCAPTURE.html) -- Rust constant
- [window-vibrancy GitHub](https://github.com/tauri-apps/window-vibrancy) -- vibrancy effects
- [Tauri backdrop-filter issue #12804](https://github.com/tauri-apps/tauri/issues/12804) -- CSS blur limitation
- [Tauri backdrop-filter issue #12437](https://github.com/tauri-apps/tauri/issues/12437) -- transparent window blur
- [Tauri window customization docs](https://v2.tauri.app/learn/window-customization/) -- transparency, decorations
- [Tauri App Store distribution](https://v2.tauri.app/distribute/app-store/) -- store submission guide
- [Tauri macOS code signing](https://v2.tauri.app/distribute/sign/macos/) -- signing and notarization
- [tauri-plugin-store docs](https://v2.tauri.app/plugin/store/) -- KV storage
- [tauri-plugin-sql docs](https://v2.tauri.app/plugin/sql/) -- SQLite integration
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- markdown renderer
- [CodeMirror 6](https://codemirror.net/) -- editor framework
- [@uiw/react-codemirror GitHub](https://github.com/uiwjs/react-codemirror) -- React wrapper

---
*Stack research for: Steadi -- Cross-platform invisible teleprompter*
*Researched: 2026-02-15*
