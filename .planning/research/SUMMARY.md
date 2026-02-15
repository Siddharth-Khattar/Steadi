# Project Research Summary

**Project:** Steadi
**Domain:** Cross-platform invisible teleprompter desktop application (macOS + Windows)
**Researched:** 2026-02-15
**Confidence:** MEDIUM (strong on stack and features; significant platform-level risks in overlay invisibility)

## Executive Summary

Steadi is a cross-platform desktop teleprompter that combines two high-value capabilities no existing product offers together: screen-capture-invisible overlay and on-device voice-synced scrolling, delivered as free open-source software. The recommended stack is Tauri 2 (Rust backend + React frontend), which provides sub-30MB bundles, direct native API access for speech recognition and window manipulation, and built-in App Store distribution support. The architecture follows a multi-window pattern where the main editor and overlay are separate OS-level windows, with Rust as the single source of truth for all shared state and an adapter trait pattern abstracting platform-specific speech implementations behind conditional compilation.

The competitive analysis of 15+ products confirms Steadi occupies an uncontested niche: no product combines invisibility + voice sync + cross-platform + open-source + on-device processing. The closest competitor (Notchie) is Mac-only, closed-source, and $30. Feature research identified four table-stakes features currently deferred to post-v1 that should be promoted: font size adjustment, opacity control, resizable overlay, and countdown timer. These are trivial to implement and their absence would make the product feel incomplete.

The dominant risk is platform-level: macOS 15+ changed its window compositing model so that `NSWindow.sharingType = .none` is no longer respected by ScreenCaptureKit-based screen capture. This means the core invisibility feature is degrading on Apple's latest OS. On Windows, `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` has documented incompatibilities with WebView2 and transparent windows -- the exact combination Steadi requires. Both of these must be validated with proof-of-concept builds before any significant development investment. The voice-sync subsystem carries a secondary risk: Apple's SFSpeechRecognizer has a known timestamp-reset bug during long sessions, requiring text-matching (not timestamps) as the primary scroll-positioning strategy.

## Key Findings

### Recommended Stack

The stack centers on Tauri 2 with React/TypeScript frontend and Rust backend. Tauri is the only viable Electron alternative that provides native Rust access to platform APIs (SFSpeechRecognizer, NSWindow, Win32 display affinity). The frontend uses Zustand for lightweight state management and Tailwind CSS v4 for the glassmorphic design system with native blur/vibrancy support. Platform-specific speech processing uses `objc2-speech` on macOS and `cpal` + `ort` (ONNX Runtime) + Silero VAD on Windows.

**Core technologies:**
- **Tauri 2.10.x:** Desktop framework with native Rust backend -- only option that supports both platform-native speech APIs and sub-30MB bundles
- **React 19.2.x + TypeScript 5.9.x:** UI framework with mature ecosystem for markdown editing (CodeMirror 6) and rendering (react-markdown)
- **Zustand 5.x:** ~1KB state management -- manages teleprompter state without Redux overhead
- **Tailwind CSS 4.x:** Utility-first CSS with native `backdrop-blur` and opacity utilities for glassmorphic UI
- **objc2-speech (macOS):** Rust bindings to SFSpeechRecognizer for word-level on-device speech recognition
- **cpal + ort + Silero VAD (Windows):** Audio capture + ONNX inference for voice activity detection (~1MB model)
- **Tauri built-in window effects:** Native vibrancy/mica/acrylic (CSS `backdrop-filter` does NOT work for desktop frosted glass on Tauri transparent windows)

**Critical stack note:** CSS `backdrop-filter: blur()` only blurs content within the webview, not the desktop behind it. Native platform vibrancy APIs (via Tauri built-in effects) are required for true frosted-glass appearance.

### Expected Features

**Must have (table stakes):**
- Adjustable scroll speed, play/pause controls, keyboard shortcuts
- Font size adjustment in overlay (currently deferred -- promote to v1)
- Opacity/transparency control (currently deferred -- promote to v1)
- Resizable overlay window (promote to v1)
- Script save/load with file/folder tree
- Draggable, repositionable overlay with position persistence
- Countdown timer before scroll start (trivial, expected UX)

**Should have (differentiators):**
- Invisible overlay (screen-capture hidden) -- the core value proposition
- Voice-synced scrolling (macOS: word-level, Windows: cadence-based) -- second pillar
- Open-source (MIT) + fully on-device -- verifiable privacy, zero cost
- Notes-app-style markdown editor with file tree -- uncommon in teleprompters
- Markdown rendering in overlay -- visual hierarchy while reading
- Rewind-to-sentence hotkey -- unique recovery mechanism
- Glassmorphic design language -- visual differentiation from universally dated competitors

**Defer (v2+):**
- AI script generation, video recording, cloud sync, multi-user collaboration
- Remote control from second device, mirror/flip mode
- Multi-language voice recognition (English-first; macOS can expose later trivially)
- Linux support, RTL support, plugin system, App Store submission

### Architecture Approach

The system is a dual-window Tauri 2 application: a main editor window and a separate overlay window, each with its own React entry point and Vite bundle. Rust owns all shared state (`tauri::State<Mutex<AppState>>`), and windows communicate through Tauri's IPC (commands for requests, events for state updates). Speech processing uses an adapter trait with compile-time platform dispatch (`#[cfg(target_os)]`), running on dedicated background threads that feed into a Scroll Controller which emits position updates to the overlay.

**Major components:**
1. **Main Window (React)** -- Script editor, file tree, settings, overlay launch
2. **Overlay Window (React)** -- Lightweight teleprompter display with markdown rendering, scroll position tracking
3. **Window Manager (Rust)** -- Creates overlay, sets always-on-top, configures screen-capture exclusion, persists position
4. **Scroll Controller (Rust)** -- Consumes speech adapter events, computes scroll position, emits updates to overlay at capped frame rate
5. **SpeechScrollAdapter (Rust trait)** -- Platform abstraction; macOS impl uses SFSpeechRecognizer (word-position events), Windows impl uses Silero VAD (cadence/pause events)
6. **Script Storage** -- Filesystem-based using platform app-data directories; serde JSON for metadata, raw .md files for content

### Critical Pitfalls

1. **macOS 15+ ScreenCaptureKit ignores window hiding** -- `NSWindow.sharingType = .none` is not respected by ScreenCaptureKit, which Apple is pushing all capture apps to adopt. Test against Zoom/Teams/Meet/OBS on macOS 14 AND 15+. Accept that invisibility is a degrading capability and design accordingly. Investigate Notchie's window-layering workarounds.

2. **WebView2 + WDA_EXCLUDEFROMCAPTURE conflict on Windows** -- `SetWindowDisplayAffinity` may fail with COMException on WebView2 windows, especially when transparency is enabled. Test the exact combination (transparent Tauri window + WebView2 + display affinity) early. May require a separate native overlay window.

3. **SFSpeechRecognizer timestamp resets** -- Timestamps reset to zero mid-session (~60s), breaking scroll tracking. Use fuzzy text-matching against the script as the primary positioning strategy from day one; use timestamps only as supplementary hints.

4. **Transparent windows break after bundling** -- Transparency works in `tauri dev` but fails in production DMG builds. Always test with `tauri build` from the first week. Apply native window property overrides as safety net.

5. **ONNX Runtime DLL conflicts on Windows** -- System-installed `onnxruntime.dll` can shadow the bundled version. Use `ort` crate's `copy-dylibs` feature and test on clean Windows VMs without dev tools.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Platform Validation

**Rationale:** The overlay invisibility is the product's core value proposition AND the highest-risk component. Both macOS 15+ and Windows have documented issues that could block the entire product. This must be validated before investing in speech, editor, or polish. Simultaneously, the editor has zero platform dependencies and establishes the design system.

**Delivers:** Working multi-window Tauri app with transparent overlay, screen-capture exclusion validated on both platforms, script editor with file tree, glassmorphic UI primitives.

**Addresses features:** Invisible overlay, script editor with file tree, markdown editor with preview, save/load scripts, draggable/resizable overlay, light/dark mode with glassmorphic aesthetic.

**Avoids pitfalls:** macOS 15+ ScreenCaptureKit issue (validate early), transparent window bundling failures (test production builds immediately), WebView2 + display affinity conflict (validate Windows path), objc2 memory safety (establish safe abstraction layer), App Store entitlements (configure from first commit).

### Phase 2: Overlay Controls and Auto-Scroll

**Rationale:** Before adding speech complexity, the overlay must be fully functional with manual and auto-scroll controls. This proves the IPC patterns, event-driven scroll architecture, and overlay rendering pipeline. Auto-scroll is also the fallback when voice sync is unavailable.

**Delivers:** Keyboard shortcuts (play/pause/speed), auto-scroll at adjustable speed, markdown rendering in overlay, font size and opacity controls, countdown timer, hover-to-pause.

**Addresses features:** Play/pause, scroll speed, keyboard shortcuts, markdown rendering in overlay, font size adjustment, opacity control, countdown timer, hover-to-pause, auto-scroll fallback.

**Avoids pitfalls:** IPC bottleneck from excessive events (establish throttled event pattern), backdrop-filter performance (use native vibrancy for background, avoid animating blurred elements).

### Phase 3: Voice-Synced Scrolling (macOS)

**Rationale:** macOS speech integration is the more capable path (word-level tracking) and uses Apple's built-in SFSpeechRecognizer. Build this first to establish the SpeechScrollAdapter trait and Scroll Controller patterns that Windows will reuse.

**Delivers:** SpeechScrollAdapter trait definition, macOS implementation via objc2-speech, word-to-script fuzzy matching algorithm, rewind-to-sentence hotkey, microphone permission handling.

**Addresses features:** Voice-synced scrolling (macOS), rewind-to-sentence hotkey.

**Avoids pitfalls:** SFSpeechRecognizer timestamp resets (text-matching primary, timestamps supplementary), objc2 exception safety (enable `exception` feature), blocking main thread with speech (dedicated background thread).

### Phase 4: Voice-Synced Scrolling (Windows)

**Rationale:** Windows uses a different approach (cadence-based VAD instead of word-level STT) and has its own integration challenges (ONNX Runtime DLL conflicts, cpal buffer sizing). The adapter trait from Phase 3 defines the contract; this phase implements the Windows side.

**Delivers:** Windows SpeechScrollAdapter implementation via cpal + Silero VAD, cadence-based scroll speed modulation, ONNX Runtime bundling with DLL conflict prevention.

**Addresses features:** Voice-synced scrolling (Windows), cross-platform parity.

**Avoids pitfalls:** ONNX Runtime DLL conflicts (copy-dylibs, clean-machine testing), cpal buffer size latency (explicit BufferSize::Fixed), bundle size (minimal ONNX build, target under 30MB).

### Phase 5: Polish, Settings, and Distribution Readiness

**Rationale:** With core functionality complete, this phase handles the fit-and-finish that makes the app feel production-grade: persistent settings, code signing, sandboxing, performance optimization, and comprehensive cross-platform testing.

**Delivers:** Settings persistence (tauri-plugin-store), app sandboxing and entitlements, code signing and notarization, performance tuning (memory < 100MB, launch < 2s), multi-monitor support, comprehensive QA.

**Avoids pitfalls:** App Store entitlement rejections (verify with codesign), glassmorphic performance on low-end hardware (profile GPU, limit blur layers), multi-monitor overlay placement issues.

### Phase Ordering Rationale

- **Phase 1 must come first** because overlay invisibility is both the core product and the highest technical risk. If screen-capture exclusion is fundamentally broken, the product strategy must pivot before investing in speech or polish.
- **Phase 2 before speech** because auto-scroll proves the overlay rendering pipeline, IPC patterns, and scroll architecture without platform-specific speech complexity. It also delivers a usable product (manual teleprompter) for early testing.
- **macOS speech (Phase 3) before Windows speech (Phase 4)** because the SFSpeechRecognizer approach is more capable (word-level) and defines the adapter trait contract. Windows then implements against a proven interface.
- **Polish last (Phase 5)** because settings, signing, and distribution are additive -- they do not affect the core architecture and benefit from all features being stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Needs proof-of-concept research for screen-capture exclusion on macOS 15+ and Windows WebView2. The macOS 15 ScreenCaptureKit issue is partially unresolved upstream (Apple has not provided a replacement API). Investigate Notchie's window-layering approach.
- **Phase 3:** SFSpeechRecognizer integration via objc2-speech needs API exploration. The text-matching algorithm for scroll positioning is a novel implementation requiring experimentation.
- **Phase 4:** Silero VAD + ONNX Runtime bundling on Windows needs build system research. Clean-machine DLL resolution must be validated.

Phases with standard patterns (skip deep research):
- **Phase 2:** Keyboard shortcuts, auto-scroll, overlay controls are well-documented Tauri + React patterns. Tauri's global-shortcut plugin and event system handle these straightforwardly.
- **Phase 5:** Code signing, sandboxing, and settings persistence follow Tauri's official distribution guides with minimal ambiguity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework (Tauri 2, React, Zustand, Tailwind) versions verified against official sources. Some Rust crate versions (objc2 ecosystem, ort RC) are MEDIUM -- verify with `cargo search` at project init. |
| Features | HIGH | Based on analysis of 15+ competitor products. Table stakes, differentiators, and anti-features are well-identified. Competitive positioning is clear and uncontested. |
| Architecture | HIGH (patterns), MEDIUM (platform integration) | Tauri 2 multi-window, IPC, and adapter patterns are well-documented. Platform-native integration (objc2, Win32 display affinity) has sparse Tauri-specific examples. |
| Pitfalls | HIGH (identification), MEDIUM (mitigation) | Pitfalls are verified against official GitHub issues and Apple Developer Forums. Mitigations for the two critical ones (macOS 15 ScreenCaptureKit, WebView2 + WDA) are uncertain -- they may require architectural workarounds not yet proven. |

**Overall confidence:** MEDIUM

The stack and feature decisions are solid. The architecture patterns are proven for Tauri 2 apps. However, the product's core value proposition (invisible overlay) faces legitimate platform-level threats on both macOS 15+ and Windows that cannot be fully mitigated through software design alone. Phase 1 must function as a technical feasibility validation before committing to the full build.

### Gaps to Address

- **macOS 15+ invisibility workaround:** No proven alternative to `sharingType = .none` exists for ScreenCaptureKit. Notchie reportedly still works -- reverse-engineer their approach during Phase 1.
- **WebView2 + transparency + display affinity combination:** No confirmed working example of all three together on Windows. Must build and test a proof-of-concept.
- **objc2 framework crate versions:** Exact compatible versions of objc2-speech, objc2-app-kit, objc2-foundation need verification via `cargo search` at project initialization. Versions in STACK.md are approximate.
- **ort stable release timeline:** ort 2.0.0-rc.11 is a release candidate. Monitor for stable release; pin exact RC version until then.
- **Click-through vs. hover-to-pause conflict:** Both features are in v1 scope but may conflict (click-through passes mouse events through the overlay, preventing hover detection). Needs UX design decision: likely a toggle between interactive and click-through modes.
- **Silero VAD cadence-to-scroll mapping:** The algorithm for converting voice activity probability into scroll speed is not documented anywhere -- it requires experimentation and tuning during Phase 4.

## Sources

### Primary (HIGH confidence)
- [Tauri 2 official documentation](https://v2.tauri.app/) -- framework, plugins, distribution, security model
- [Apple Developer Documentation](https://developer.apple.com/documentation/) -- SFSpeechRecognizer, NSWindow, ScreenCaptureKit
- [Microsoft Learn](https://learn.microsoft.com/) -- SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE
- [Tauri GitHub Issues](https://github.com/tauri-apps/tauri/issues) -- #14200 (macOS 15 ScreenCaptureKit), #13415 (transparent window build), #8255 (focus glitch)
- 15+ competitor product analyses (Notchie, PromptSmart, Speakflow, QPrompt, ScreenPrompt, and others)

### Secondary (MEDIUM confidence)
- [Apple Developer Forums](https://developer.apple.com/forums/) -- macOS 15 sharingType behavior (#792152), SFTranscriptionSegment timestamp resets (#128722)
- [WebView2 Feedback](https://github.com/MicrosoftEdge/WebView2Feedback/issues/841) -- SetWindowDisplayAffinity COMException with WebView2
- [Silero VAD GitHub](https://github.com/snakers4/silero-vad) -- ONNX model compatibility, version conflicts
- [ort crate docs](https://ort.pyke.io/) -- ONNX Runtime Rust bindings, DLL management
- Community blog posts on invisible overlay techniques and Tauri multi-window patterns

### Tertiary (LOW confidence)
- macOS 15+ invisibility workarounds -- no documented solution exists; Notchie's approach is undocumented
- Exact objc2 framework crate version compatibility -- could not verify via web fetch; needs `cargo search`
- Silero VAD cadence-to-scroll mapping algorithm -- no prior art; requires experimentation

---
*Research completed: 2026-02-15*
*Ready for roadmap: yes*
