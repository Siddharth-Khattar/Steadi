# Pitfalls Research

**Domain:** Cross-platform invisible teleprompter (Tauri 2, Rust + React, native platform APIs, on-device speech)
**Researched:** 2026-02-15
**Confidence:** HIGH (verified against official docs, Tauri GitHub issues, Apple Developer Forums)

## Critical Pitfalls

### Pitfall 1: macOS 15+ ScreenCaptureKit Ignores NSWindow.sharingType = .none

**What goes wrong:**
The entire invisibility premise of Steadi relies on `NSWindow.sharingType = .none` hiding the overlay from screen capture. On macOS 15 (Sequoia) and later, Apple changed the window compositing model: all visible window contents are composited into a single framebuffer before being sent to the display. ScreenCaptureKit -- the modern capture API that Apple now requires apps to use (CGWindowListCreateImage is deprecated/obsoleted in macOS 15) -- captures this framebuffer directly. The `sharingType = .none` flag is only respected by the legacy CoreGraphics capture APIs, not by ScreenCaptureKit.

This means as Zoom, Teams, Meet, and OBS migrate to ScreenCaptureKit (which Apple is pushing), `sharingType = .none` will stop hiding windows from those apps. Some may still use legacy APIs today, but this is a ticking clock.

**Why it happens:**
Apple deliberately changed the compositing pipeline in macOS 15 for security and performance reasons. Apple's developer forums confirm there is currently no public API for preventing ScreenCaptureKit from capturing a window. Apple suggests filing Feedback Assistant requests. This is tracked as [Tauri issue #14200](https://github.com/tauri-apps/tauri/issues/14200) and marked as "upstream" (blocked on Apple).

**How to avoid:**
1. **Test aggressively on macOS 15+** with each target app (Zoom, Teams, Meet, OBS) to determine which still use legacy capture APIs vs. ScreenCaptureKit. Document the current state.
2. **Accept that this is a degrading capability.** Design the product so that "invisible from screen capture" is the primary value proposition but not the only one -- voice-synced scrolling has standalone value.
3. **Monitor Apple's developer forums and WWDC announcements** for any new content-protection APIs. Apple may introduce a ScreenCaptureKit-compatible exclusion mechanism.
4. **Consider a hybrid approach:** On macOS 15+, if invisibility cannot be guaranteed, show a clear status indicator to the user: "Hidden from: Zoom (yes), OBS (no)" based on runtime detection.
5. **Notchie (the inspiration app) apparently still works** by leveraging NSWindowLevel positioning that current versions of conferencing apps happen to exclude. This is fragile but worth investigating -- it may use a combination of window level and sharingType.

**Warning signs:**
- The overlay appears in screen recordings or screenshots on macOS 15+
- Conferencing apps update and suddenly capture the overlay
- Apple deprecation warnings in Xcode for sharingType-related APIs

**Phase to address:**
Phase 1 (Core overlay window). This must be validated immediately as it is foundational. Build a proof-of-concept that tests invisibility against Zoom, Teams, Meet, and OBS on macOS 14 AND macOS 15+ before committing to the full architecture.

---

### Pitfall 2: SFSpeechRecognizer Timestamp Drift and Reset in Long Sessions

**What goes wrong:**
The PRD specifies word-level script tracking on macOS using `SFSpeechRecognizer` segment timestamps. A known bug causes `SFTranscriptionSegment` timestamps to reset to zero mid-session, typically after approximately one minute of audio, though the timing is inconsistent. When timestamps reset, the scroll controller loses its position in the script, causing the teleprompter to jump back to the beginning or behave erratically.

**Why it happens:**
This is a documented bug in Apple's Speech framework on macOS, reported in [Apple Developer Forums](https://developer.apple.com/forums/thread/128722). The timestamp resets appear to correlate with internal recognition session boundaries. While on-device recognition (`requiresOnDeviceRecognition = true`) removes the one-minute audio duration limit, the timestamp reset bug persists independently of duration limits.

**How to avoid:**
1. **Do not rely solely on absolute timestamps** for script position tracking. Instead, use the recognized text content for fuzzy string matching against the script. Match recognized words to script positions using text similarity, not audio timing.
2. **Implement a dual-tracking strategy:** Use timestamps as a performance hint (for smooth scrolling between word matches) but always anchor position based on recognized text content.
3. **Detect timestamp resets** by monitoring for sudden drops in timestamp values between consecutive segments. When detected, fall back to text-only matching until timestamps stabilize.
4. **Consider SpeechAnalyzer** (announced WWDC 2025, available in macOS 26 / iOS 26) as a future migration path. It is described as faster and better for long-form audio. However, it requires macOS 26+, so SFSpeechRecognizer remains the pragmatic choice for broad compatibility.

**Warning signs:**
- Teleprompter suddenly jumps back to the top during a presentation
- Word-position tracking degrades after ~60 seconds of continuous speech
- Inconsistent behavior between short test sessions and real-world usage

**Phase to address:**
Phase 2 (Voice-synced scrolling). The text-matching approach should be the primary algorithm from day one; timestamps should supplement, not drive, scroll position.

---

### Pitfall 3: Tauri 2 Transparent Window Rendering Breaks After Bundling on macOS

**What goes wrong:**
Transparent windows that work perfectly in `tauri dev` mode lose their transparency after building and packaging into a DMG. The window renders with an opaque white or black background instead of being transparent. This is tracked in [Tauri issue #13415](https://github.com/tauri-apps/tauri/issues/13415).

Additionally, on macOS, transparent windows experience visual glitches after focus changes ([Tauri issue #8255](https://github.com/tauri-apps/tauri/issues/8255)), and on Windows, the v2 transparent window behavior is inconsistent with v1 ([Tauri issue #8308](https://github.com/tauri-apps/tauri/issues/8308)).

**Why it happens:**
The Tauri bundler applies different configurations during development vs. production builds. The transparency flag does not consistently propagate through the macOS bundling pipeline. Focus-change glitches relate to how macOS recomposites windows during activation/deactivation cycles.

**How to avoid:**
1. **Test production builds from day one.** Never rely on `tauri dev` as proof that visual behavior works. Run `tauri build` and test the resulting DMG/MSI after every visual change.
2. **Set transparency in both Tauri config AND at the native level.** Use `objc2` to programmatically set `NSWindow.isOpaque = false` and `NSWindow.backgroundColor = NSColor.clear` as a safety net, not just the Tauri config.
3. **Pin a known-good Tauri version** that has confirmed transparent window support. Check the Tauri changelog for transparency-related fixes before upgrading.
4. **Avoid focus-dependent rendering.** The overlay should use `app.set_activation_policy(tauri::ActivationPolicy::Accessory)` so it does not participate in normal window focus cycling.

**Warning signs:**
- Works in dev, breaks in build
- White/black flash when switching windows
- Transparency works on one platform but not the other

**Phase to address:**
Phase 1 (Core overlay window). Transparency must be validated in production builds on both platforms before any UI work proceeds.

---

### Pitfall 4: WebView2 + SetWindowDisplayAffinity Incompatibility on Windows

**What goes wrong:**
On Windows, `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` has documented incompatibilities with WebView2 (which Tauri uses). Setting `WDA_MONITOR` on a window hosting WebView2 causes a `COMException`. Additionally, `WDA_EXCLUDEFROMCAPTURE` fails silently on some Windows 11 machines, and fails when `AllowTransparency` is enabled on the window -- which is exactly what a glassmorphic transparent overlay requires.

**Why it happens:**
WebView2 uses a separate rendering pipeline (Chromium-based compositor) that conflicts with Windows display affinity flags. The transparency + display affinity combination is particularly problematic because both modify how the window participates in the Windows compositor (DWM).

**How to avoid:**
1. **Test the exact combination:** transparent Tauri window + WebView2 + `WDA_EXCLUDEFROMCAPTURE` on Windows 10 and multiple Windows 11 builds. This specific combination may not work.
2. **Consider a layered window approach on Windows:** Use a native Win32 overlay window (not WebView-based) for the invisible teleprompter layer, with the WebView only for the settings/editor UI.
3. **Fall back to `WDA_MONITOR`** if `WDA_EXCLUDEFROMCAPTURE` fails, though this shows a black rectangle instead of hiding the window entirely.
4. **Detect capability at runtime:** Check if `SetWindowDisplayAffinity` succeeded and inform the user if invisibility cannot be guaranteed on their system.

**Warning signs:**
- COMException when setting display affinity
- `SetWindowDisplayAffinity` returns 0 (failure)
- Overlay visible in screen recordings on Windows despite affinity being set
- Works on dev machine but fails on CI or other Windows builds

**Phase to address:**
Phase 1 (Core overlay window). Validate the Windows invisibility approach in parallel with macOS. This is a go/no-go decision point.

---

### Pitfall 5: ONNX Runtime DLL Conflicts on Windows (Silero VAD)

**What goes wrong:**
Some Windows installations ship with an older `onnxruntime.dll` in the System32 folder. When the app loads, it picks up the system DLL instead of the bundled one, causing version mismatch assertion errors at runtime. The Silero VAD model requires specific ONNX Runtime version compatibility (opset 15/16), and loading with the wrong version produces `ValueError` or crashes.

**Why it happens:**
Windows DLL search order prioritizes System32 over the application directory. Microsoft ships ONNX Runtime as part of some Windows features (e.g., Windows ML), creating version conflicts.

**How to avoid:**
1. **Use the `ort` crate with the `copy-dylibs` feature** to ensure the correct ONNX Runtime DLLs are placed alongside the binary.
2. **Use `ORT_STRATEGY=download`** (the default) rather than `system` to ensure a known-good version is bundled.
3. **Consider the `minimal-build` feature** of the `ort` crate to reduce bundle size while ensuring compatibility.
4. **Test on a clean Windows install** (VM or CI) that does not have development tools installed. The dev machine likely has the correct DLLs by coincidence.
5. **Pin the ONNX Runtime version** in Cargo.toml and verify the Silero VAD model's opset compatibility.

**Warning signs:**
- Works on dev machine, crashes on fresh Windows install
- "Assertion failed" errors referencing ONNX Runtime version
- Model loading fails with opset-related errors
- Inconsistent behavior across different Windows machines

**Phase to address:**
Phase 2 (Voice processing). Must be addressed during Windows VAD implementation. Include clean-machine testing in the validation criteria.

---

### Pitfall 6: App Store Rejection Due to Missing or Incorrect Entitlements

**What goes wrong:**
The app requires microphone access (`NSMicrophoneUsageDescription`), speech recognition (`NSSpeechRecognitionUsageDescription`), and App Sandbox (`com.apple.security.app-sandbox`). Missing any of these, or providing inadequate usage descriptions, results in immediate App Store rejection. Additionally, the App Sandbox restricts file system access to specific directories, breaking script import/export if paths are hardcoded.

**Why it happens:**
Tauri's default configuration does not include these entitlements. They must be manually added to an `Entitlements.plist` file and referenced in `tauri.conf.json > bundle > macOS > entitlements`. Developers often add entitlements late in the process and discover sandbox violations only during App Store review.

**How to avoid:**
1. **Create the Entitlements.plist from day one** with all required entitlements:
   - `com.apple.security.app-sandbox` = true
   - `com.apple.security.device.audio-input` = true (microphone)
   - `com.apple.security.device.microphone` = true
   - `NSSpeechRecognitionUsageDescription` in Info.plist
   - `NSMicrophoneUsageDescription` in Info.plist
2. **Develop with sandboxing enabled** from the start. Never defer sandbox compliance to "later."
3. **Use `NSOpenPanel` / file picker** for script import rather than direct file system paths. Sandboxed apps get temporary access to user-selected files via security-scoped bookmarks.
4. **Do NOT include `com.apple.security.network.client`** unless truly needed. Steadi is local-only, and including unnecessary network entitlements raises review flags.
5. **Test the production build with sandbox enabled** on every CI run.

**Warning signs:**
- App works in development but crashes in production build
- Permission dialogs never appear (entitlements not applied because code signing was skipped)
- File import/export fails in sandboxed mode
- App Store Connect validation errors during upload

**Phase to address:**
Phase 1 (Project scaffolding). Entitlements and sandboxing must be configured in the first commit, not retrofitted later.

---

### Pitfall 7: objc2 Memory Management and Exception Safety

**What goes wrong:**
The `objc2` crate requires careful attention to Objective-C memory management semantics. Specifically:
- Creating `NSWindow` outside a window controller requires calling `window.releasedWhenClosed(false)` or the window is double-freed.
- By default, Objective-C exceptions unwind into Rust as undefined behavior. If SFSpeechRecognizer throws an exception (which it does for invalid audio formats, missing permissions, etc.), the app crashes without a useful error message.
- The `objc2` bindings are generated in a macOS-centric manner and may reference AppKit types that do not exist on other platforms, causing compilation failures in shared code.

**Why it happens:**
Rust's ownership model and Objective-C's reference counting are fundamentally different paradigms. The `msg_send!` macro bridges them but cannot guarantee safety. Objective-C exceptions are not Rust panics and bypass all Rust unwinding infrastructure.

**How to avoid:**
1. **Enable the `exception` feature** on the `objc2` crate. This wraps each `msg_send!` in `@try/@catch` and converts Objective-C exceptions to Rust panics.
2. **Never create NSWindow directly** in Tauri -- use Tauri's window management and only use `objc2` to modify properties (sharingType, backgroundColor, etc.) on windows Tauri already owns.
3. **Isolate all `objc2` code behind `#[cfg(target_os = "macos")]`** in dedicated modules. Never let objc2 types leak into cross-platform code.
4. **Wrap all unsafe objc2 calls in safe Rust abstractions** that handle retain/release and exception safety.

**Warning signs:**
- Crashes with no Rust backtrace (Objective-C exception unwinding through Rust)
- Double-free or use-after-free on window close
- Compilation errors on Windows due to macOS-specific types in shared modules

**Phase to address:**
Phase 1 (Native platform integration layer). The safe abstraction layer over objc2 must be established before building any macOS-specific features.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `any` types in Tauri IPC commands | Faster prototyping of Rust-JS bridge | Type safety lost, runtime errors in production, harder refactoring | Never -- define proper types from day one per CLAUDE.md |
| Skipping production builds during development | Faster iteration cycle | Transparency, signing, and sandboxing bugs discovered late | Never for overlay/invisibility work; acceptable for script editor UI |
| Hardcoding platform detection instead of using adapter pattern | Simpler initial implementation | Every new feature requires platform switches scattered throughout codebase | Never -- the adapter trait is a core architectural decision |
| Bundling full ONNX Runtime instead of minimal build | Simpler build configuration | Bundle size bloat (30-50MB just for ORT), exceeding the 30MB target | Only during initial prototyping, must switch to minimal before any release |
| Using `backdrop-filter: blur()` on all UI elements | Glassmorphic design everywhere | GPU performance degradation, frame drops on older hardware, battery drain | Only on 2-3 key surfaces -- use pre-blurred backgrounds or reduced blur radius elsewhere |
| Deferring code signing setup | Faster initial development | Entitlements not tested, sandbox violations discovered at submission time | Never -- must be in the first build configuration |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SFSpeechRecognizer + Tauri IPC | Sending raw audio buffers over JSON-serialized IPC (massive overhead) | Keep all audio processing in Rust. Only send scroll position events (tiny payloads) over IPC to the frontend |
| cpal audio capture + Silero VAD | Using default buffer size (can be 1000+ frames on WASAPI, causing 50ms+ latency) | Set `BufferSize::Fixed(512)` or similar. Tune per-platform: CoreAudio defaults to 512 (fine), WASAPI and ALSA need explicit configuration |
| objc2 + Tauri window handle | Calling `ns_view()` to get the NSView, then trying to find the parent NSWindow | Use `ns_window()` directly if available, or traverse the view hierarchy safely with null checks at every step |
| ONNX Runtime + Windows DLL loading | Assuming the bundled DLL will be found automatically | Use `copy-dylibs` feature and verify DLL search order. Test on clean Windows installs |
| Tauri events + React state | Using Tauri `listen()` without cleanup, causing memory leaks and duplicate handlers | Always return and call the unlisten function in React useEffect cleanup. Use a single event listener that updates Zustand store |
| Multi-window Tauri + capabilities | Giving all windows the same capability permissions | Define separate capability files for the overlay window (minimal: just scroll events) and the editor window (file access, settings) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| backdrop-filter on animated elements | Frame drops during scroll, janky teleprompter text movement | Never animate elements that have backdrop-filter. Apply blur to a static background layer, scroll text in a separate non-blurred layer | Immediately on lower-end machines; noticeable on M1 Macs with multiple displays |
| Sending every speech recognition partial result over IPC | IPC bottleneck at ~0.5ms per invoke, speech sends 5-10 partial results per second | Debounce/coalesce speech events in Rust. Send scroll position updates at most 30fps (every 33ms) to frontend | At normal speaking pace (~150 WPM), partial results flood the IPC bridge |
| Re-rendering entire script on each scroll position update | React re-renders the full Markdown content, causing layout thrashing | Virtualize the script display. Only render visible lines plus a small buffer. Use CSS transform for smooth scrolling, not DOM manipulation | With scripts longer than ~500 words |
| Loading full ONNX Runtime at startup | App launch time exceeds 2-second target | Lazy-load the ONNX session. Initialize VAD on first mic activation, not app startup. Show "Ready" indicator when loaded | On Windows machines with HDD (not SSD) or older CPUs |
| Multiple `backdrop-filter` layers stacked | Exponential GPU cost per stacked blur layer. 3+ layers cause visible lag | Limit to max 2 glassmorphic surfaces visible simultaneously. Use opacity/gradient tricks instead of stacking blurs | When overlay + settings panel + script editor are all visible |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Including `com.apple.security.network.client` entitlement "just in case" | App Store reviewers flag unnecessary network entitlements on a privacy-focused local-only app. Also opens attack surface for future code changes that might accidentally make network calls | Only include entitlements you actively use. Steadi should have zero network entitlements |
| Storing scripts in a non-sandboxed location | App Store rejection; scripts inaccessible after sandboxing is enabled | Use `app_data_dir()` from Tauri's path API from day one. This resolves to the sandbox-compliant Application Support directory |
| Logging microphone audio to disk for debugging | Accidental recording of user's speech persisted on disk without consent | Never write raw audio to disk. Process audio in-memory only. If debugging audio pipeline, use a feature flag that is stripped in release builds |
| Using private/undocumented macOS APIs for window hiding | App Store rejection; API may break in any macOS update | Use only public APIs (NSWindow.sharingType, documented NSWindowLevel values). If investigating Notchie-style workarounds, verify each API is in the public SDK headers |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a permission dialog for microphone on first launch without context | Users deny microphone access reflexively, then cannot use voice scrolling and do not know how to re-enable it | Show an in-app explainer screen BEFORE triggering the system permission dialog. Explain why microphone is needed. Provide a fallback (manual/auto scroll) and a "re-enable microphone" button in settings |
| Making the overlay too opaque by default | Overlay obscures the camera view, defeating the purpose of maintaining eye contact | Default to 60-70% opacity with 8px blur. Let users adjust, but start subtle |
| No visual feedback during voice processing initialization | User starts talking immediately but nothing scrolls for 1-2 seconds while speech recognition loads | Show a "Listening..." indicator during initialization. Pre-load the speech recognizer when the user opens a script, not when they press "start" |
| Glassmorphic design with low contrast text | Users cannot read the teleprompter text, especially in bright rooms with webcam lighting behind the screen | Use semi-bold or bold text. Ensure minimum 4.5:1 contrast ratio between text and the blurred background. Test with actual webcam lighting conditions |
| Overlay blocks mouse interaction with apps underneath | Users cannot click through the overlay to interact with Zoom controls or other apps | Implement click-through by default (the overlay should be read-only). Only capture mouse events on explicit hover zones (resize handles, close button) |

## "Looks Done But Isn't" Checklist

- [ ] **Invisible overlay:** Tested against Zoom, Teams, Meet, AND OBS on both macOS 14, macOS 15+, Windows 10, and Windows 11 -- not just one app on one platform
- [ ] **Voice scrolling:** Tested with scripts longer than 5 minutes of continuous speech, not just 30-second demos
- [ ] **SFSpeechRecognizer timestamps:** Verified that timestamp resets do not break scroll position during sessions exceeding 2 minutes
- [ ] **Production build transparency:** DMG and MSI builds tested, not just `tauri dev`
- [ ] **Sandbox compliance:** All file operations work with App Sandbox enabled, using security-scoped bookmarks for imported files
- [ ] **Code signing:** Production builds are signed and notarized. Entitlements are actually applied (verify with `codesign -d --entitlements -`)
- [ ] **Clean machine testing:** App tested on a machine without Rust, Node, or development tools installed
- [ ] **Multi-monitor:** Overlay tested on secondary displays, including displays with different scaling factors (known Tauri issue)
- [ ] **Memory under 100MB:** Measured with Activity Monitor / Task Manager during a 15-minute session with voice scrolling active, not just at idle
- [ ] **Launch under 2 seconds:** Measured from cold start on a representative (not high-end) machine
- [ ] **Bundle under 30MB:** Measured for the final distributable (DMG/MSI), including ONNX model but excluding WebView2 runtime on Windows
- [ ] **Microphone permission dialog:** Tested the first-launch flow where user has never granted permission, including the denial flow

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| macOS 15 ScreenCaptureKit breaks invisibility | HIGH | Investigate alternative window layering techniques. Consider filing Apple Feedback and waiting for API changes. Worst case: document limitation and offer macOS 14 as recommended version |
| SFSpeechRecognizer timestamp resets | MEDIUM | Refactor scroll controller to use text-matching as primary strategy. Timestamps become supplementary. ~2-3 day refactor if caught early |
| Transparent window breaks in production build | LOW | Apply native window property overrides via objc2/Win32 as a post-creation fixup. Usually a one-line fix once identified |
| WebView2 + WDA_EXCLUDEFROMCAPTURE conflict | HIGH | Requires architectural change: separate native overlay window from WebView content window. Significant refactor of the window management layer |
| ONNX DLL conflict on Windows | LOW | Bundle DLLs alongside binary using `copy-dylibs`. Add DLL search path override at startup. 1-day fix |
| App Store rejection for entitlements | MEDIUM | Fix entitlements, rebuild, resign, resubmit. Each review cycle takes 1-3 days. Cost is in time, not code complexity |
| objc2 exception crash | LOW-MEDIUM | Enable `exception` feature flag. Wrap problematic calls in safe abstractions. 1-2 day fix, but finding the crash site without stack traces can take longer |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| macOS 15 ScreenCaptureKit ignores sharingType | Phase 1: Core overlay | Build proof-of-concept, test against all target apps on macOS 14 and 15+. Document results before proceeding |
| SFSpeechRecognizer timestamp drift | Phase 2: Voice scrolling | Run 10-minute continuous speech test. Verify scroll position accuracy remains within +/- 2 lines of expected position throughout |
| Tauri transparent window breaks in build | Phase 1: Core overlay | Run `tauri build` and verify transparency on both platforms. Automate this check in CI |
| WebView2 + WDA_EXCLUDEFROMCAPTURE conflict | Phase 1: Core overlay | Test transparent WebView2 window with display affinity on Windows 10 and 11. Document success/failure matrix |
| ONNX Runtime DLL conflicts | Phase 2: Voice processing (Windows) | Test on clean Windows VM without development tools. Verify model loads correctly |
| App Store entitlements | Phase 1: Project scaffolding | Include Entitlements.plist in first commit. Verify with `codesign -d --entitlements -` on every build |
| objc2 memory/exception safety | Phase 1: Native platform layer | Enable exception feature. Write safe wrapper trait. Test window creation and destruction cycles |
| Glassmorphic performance on low-end | Phase 3: UI polish | Profile GPU usage with 3+ glass surfaces. Ensure <16ms frame times on baseline hardware |
| IPC bottleneck from speech events | Phase 2: Voice scrolling | Benchmark IPC throughput. Verify <33ms round-trip for scroll position updates |
| Multi-monitor overlay placement | Phase 1: Core overlay | Test overlay on secondary display. Verify correct positioning after display configuration changes |

## Sources

- [Tauri Issue #14200: macOS 15+ ScreenCaptureKit ignores sharingType](https://github.com/tauri-apps/tauri/issues/14200)
- [Apple Developer Forums: NSWindow sharingType on macOS 15.4+](https://developer.apple.com/forums/thread/792152)
- [Apple Developer Documentation: NSWindow.SharingType.none](https://developer.apple.com/documentation/appkit/nswindow/sharingtype-swift.enum/none)
- [Tauri Issue #13415: Transparent windows lose transparency after DMG build](https://github.com/tauri-apps/tauri/issues/13415)
- [Tauri Issue #8255: Transparent window glitch on macOS after focus change](https://github.com/tauri-apps/tauri/issues/8255)
- [Tauri Issue #8308: v2 window.transparent not working](https://github.com/tauri-apps/tauri/issues/8308)
- [WebView2 + SetWindowDisplayAffinity COMException](https://github.com/MicrosoftEdge/WebView2Feedback/issues/841)
- [Apple Developer Forums: SFTranscriptionSegment timestamp resets](https://developer.apple.com/forums/thread/128722)
- [Apple Developer Documentation: requiresOnDeviceRecognition](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition)
- [WWDC 2025: SpeechAnalyzer (future replacement for SFSpeechRecognizer)](https://developer.apple.com/videos/play/wwdc2025/277/)
- [Silero VAD ONNX Runtime version incompatibility](https://github.com/snakers4/silero-vad/issues/376)
- [cpal buffer size strategy for ALSA](https://github.com/RustAudio/cpal/issues/446)
- [objc2 crate documentation: exception safety](https://docs.rs/objc2/latest/objc2/)
- [objc2: NSWindow creation requires releasedWhenClosed(false)](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSWindow.html)
- [Tauri App Store distribution guide](https://v2.tauri.app/distribute/app-store/)
- [Tauri Microsoft Store distribution guide](https://v2.tauri.app/distribute/microsoft-store/)
- [Tauri macOS microphone permission issue](https://github.com/tauri-apps/tauri/issues/11951)
- [ort crate: Windows DLL conflicts](https://crates.io/crates/ort/1.13.2)
- [CSS backdrop-filter performance in shadcn-ui](https://github.com/shadcn-ui/ui/issues/327)
- [WebView2 GPU compositing limitations](https://github.com/MicrosoftEdge/WebView2Feedback/issues/5072)
- [Tauri IPC performance: ~0.5ms per invoke](https://777genius.github.io/state-sync/benchmarks)
- [Tauri multi-monitor window issues](https://github.com/tauri-apps/tauri/issues/14019)
- [Tauri display scaling issues](https://github.com/tauri-apps/tauri/issues/10263)

---
*Pitfalls research for: Cross-platform invisible teleprompter (Tauri 2 + native platform APIs)*
*Researched: 2026-02-15*
