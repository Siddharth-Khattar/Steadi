# Architecture Research

**Domain:** Cross-platform desktop teleprompter (Tauri 2 + React)
**Researched:** 2026-02-15
**Confidence:** HIGH (Tauri 2 patterns), MEDIUM (platform-native integration), LOW (macOS 15+ screen capture)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Zustand)                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐     │
│  │ Main Window  │  │ Overlay Window   │  │ Shared Stores      │     │
│  │ - File tree  │  │ - Teleprompter   │  │ - scriptStore      │     │
│  │ - MD editor  │  │ - Rendered MD    │  │ - overlayStore     │     │
│  │ - Preview    │  │ - Scroll pos     │  │ - settingsStore    │     │
│  │ - Controls   │  │ - Highlight      │  │ - speechStore      │     │
│  └──────┬───────┘  └────────┬─────────┘  └────────────────────┘     │
│         │                   │                                       │
├─────────┴───────────────────┴───────────────────────────────────────┤
│                   TAURI IPC BOUNDARY                                │
│          invoke() commands ↓      ↑ emit() events                   │
├─────────────────────────────────────────────────────────────────────┤
│                     RUST BACKEND (src-tauri)                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐     │
│  │  Commands    │  │ Window Manager   │  │  App State         │     │
│  │ - script_*   │  │ - create overlay │  │ - Mutex<AppState>  │     │
│  │ - overlay_*  │  │ - position/size  │  │ - settings         │     │
│  │ - speech_*   │  │ - screen-hide    │  │ - active script    │     │
│  │ - settings_* │  │ - always-on-top  │  │ - scroll position  │     │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬───────────┘     │
│         │                   │                      │                │
│  ┌──────┴───────────────────┴──────────────────────┴───────────┐    │
│  │                    Scroll Controller                         │    │
│  │  Consumes SpeechScrollEvent → computes scroll delta          │    │
│  │  Emits scroll-update events to overlay window                │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │              SpeechScrollAdapter (Rust trait)                │    │
│  │                                                              │    │
│  │  ┌─────────────────────┐    ┌─────────────────────────┐     │    │
│  │  │ macOS: SFSpeech     │    │ Windows: Silero VAD     │     │    │
│  │  │ objc2-speech crate  │    │ silero-vad-rs + cpal    │     │    │
│  │  │ Word-position events│    │ Cadence/pause events    │     │    │
│  │  │ #[cfg(target_os =   │    │ #[cfg(target_os =       │     │    │
│  │  │   "macos")]         │    │   "windows")]           │     │    │
│  │  └─────────────────────┘    └─────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Script Storage                             │   │
│  │  Local filesystem (platform-standard app data dirs)           │   │
│  │  serde JSON for metadata, raw .md files for content           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Main Window (React) | Script editing, file management, settings, launch overlay | React + Tailwind + Zustand; glassmorphic panels |
| Overlay Window (React) | Render teleprompter text, display scroll position, highlight current word/sentence | Separate React entry point; minimal chrome, transparent background |
| Tauri Commands | Bridge frontend requests to Rust logic; type-safe IPC | `#[tauri::command]` functions, optionally via tauri-specta for TS type generation |
| Window Manager (Rust) | Create/destroy overlay, set always-on-top, configure screen-capture exclusion, persist position | `WebviewWindowBuilder`, platform-specific NSWindow/HWND manipulation |
| Scroll Controller (Rust) | Consume speech adapter events, compute scroll position/speed, emit scroll updates to overlay | Runs on dedicated thread; sends events via `app.emit_to()` |
| SpeechScrollAdapter (Rust trait) | Abstract over platform speech input; produce unified `SpeechScrollEvent` | Trait with `start()`, `stop()`, `on_event()` callback; `#[cfg]` dispatches to platform impl |
| macOS Speech Adapter | On-device speech recognition via SFSpeechRecognizer | `objc2-speech` crate; emits word-position events for script tracking |
| Windows Speech Adapter | Voice activity detection via Silero VAD | `silero-vad-rs` + `cpal` for audio capture; emits cadence/pause events |
| Script Storage | Load/save scripts and folder structure | `std::fs` with platform app data dirs via `dirs` crate; serde for metadata |
| App State (Rust) | Shared mutable state across commands | `tauri::State<Mutex<AppState>>` managed by Tauri builder |

## Recommended Project Structure

```
steadi/
├── src/                         # React frontend
│   ├── main/                    # Main window entry
│   │   ├── App.tsx              # Main window root component
│   │   ├── index.html           # Main window HTML entry
│   │   └── main.tsx             # Main window React mount
│   ├── overlay/                 # Overlay window entry
│   │   ├── App.tsx              # Overlay root component
│   │   ├── index.html           # Overlay HTML entry
│   │   └── main.tsx             # Overlay React mount
│   ├── components/              # Shared React components
│   │   ├── editor/              # Markdown editor components
│   │   ├── filetree/            # File/folder sidebar
│   │   ├── overlay/             # Teleprompter display components
│   │   ├── settings/            # Settings panel
│   │   └── ui/                  # Glassmorphic primitives (Glass, Blur, etc.)
│   ├── hooks/                   # Custom React hooks
│   │   ├── useTauriEvent.ts     # Hook for Tauri event listeners
│   │   ├── useScript.ts         # Script CRUD operations
│   │   └── useOverlay.ts        # Overlay control hooks
│   ├── stores/                  # Zustand stores
│   │   ├── scriptStore.ts       # Script state (active file, content, tree)
│   │   ├── overlayStore.ts      # Overlay state (scroll pos, visibility)
│   │   ├── settingsStore.ts     # User preferences
│   │   └── speechStore.ts       # Speech status (active, paused, mode)
│   ├── lib/                     # Utilities and helpers
│   │   ├── tauri.ts             # Typed Tauri invoke/listen wrappers
│   │   ├── markdown.ts          # Markdown parsing utilities
│   │   └── keybindings.ts       # Keyboard shortcut definitions
│   └── styles/                  # Global styles, Tailwind config
│       └── globals.css
├── src-tauri/                   # Rust backend
│   ├── Cargo.toml               # Dependencies with platform cfg
│   ├── Cargo.lock
│   ├── tauri.conf.json          # Tauri config: windows, capabilities
│   ├── capabilities/            # Per-window capability files
│   │   ├── main-window.json     # Main window permissions
│   │   └── overlay-window.json  # Overlay window permissions (minimal)
│   ├── icons/
│   ├── src/
│   │   ├── main.rs              # Desktop entry point (calls run())
│   │   ├── lib.rs               # App setup: Builder, plugins, state, commands
│   │   ├── commands/            # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── script.rs        # Script CRUD commands
│   │   │   ├── overlay.rs       # Overlay control commands
│   │   │   ├── speech.rs        # Start/stop speech, sensitivity
│   │   │   └── settings.rs      # Settings read/write commands
│   │   ├── state.rs             # AppState definition
│   │   ├── window.rs            # Window creation, screen-hide, positioning
│   │   ├── scroll.rs            # ScrollController logic
│   │   ├── speech/              # Speech adapter subsystem
│   │   │   ├── mod.rs           # Trait definition + factory
│   │   │   ├── adapter.rs       # SpeechScrollAdapter trait
│   │   │   ├── events.rs        # SpeechScrollEvent enum
│   │   │   ├── macos.rs         # macOS SFSpeechRecognizer impl (#[cfg])
│   │   │   └── windows.rs       # Windows Silero VAD impl (#[cfg])
│   │   ├── audio.rs             # cpal microphone capture (Windows)
│   │   └── storage/             # Script persistence
│   │       ├── mod.rs
│   │       └── fs.rs            # Filesystem-based script storage
│   └── build.rs                 # Build script (entitlements, env)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts               # Multi-entry Vite config for main + overlay
```

### Structure Rationale

- **`src/main/` and `src/overlay/`:** Tauri 2 supports multiple windows, each with its own HTML entry point. Vite multi-page mode gives each window its own bundle. The overlay window should be as lightweight as possible (no editor code, no file tree) to minimize memory usage.
- **`src/components/`:** Shared components live outside window-specific folders. Glassmorphic primitives (`ui/`) are reusable across both windows.
- **`src/stores/`:** Zustand stores are per-window (each window mounts its own React tree), but the Rust backend is the source of truth for shared state. Frontend stores sync via Tauri events.
- **`src-tauri/capabilities/`:** Tauri 2's security model requires declaring per-window capabilities. The overlay window should have minimal permissions (no filesystem, no dialogs). The main window gets script storage, dialog, and speech permissions.
- **`src-tauri/src/commands/`:** One file per domain. Commands are thin wrappers that call into domain modules (speech, storage, scroll).
- **`src-tauri/src/speech/`:** The adapter pattern is the architectural centerpiece. The trait, event types, and platform implementations live together. Conditional compilation (`#[cfg(target_os = "...")]`) selects the right implementation at compile time.

## Architectural Patterns

### Pattern 1: Adapter Trait with Conditional Compilation

**What:** Define a Rust trait `SpeechScrollAdapter` with platform-specific implementations selected at compile time via `#[cfg(target_os)]`.
**When to use:** Any time the same logical operation requires different platform implementations (speech, screen-hide, audio capture).
**Trade-offs:** Zero runtime overhead (compile-time dispatch). Cannot switch implementations at runtime. Each platform builds only its own adapter code and dependencies.

**Example:**
```rust
// speech/adapter.rs
pub trait SpeechScrollAdapter: Send + Sync {
    fn start(&mut self, callback: Box<dyn Fn(SpeechScrollEvent) + Send>) -> Result<()>;
    fn stop(&mut self) -> Result<()>;
    fn set_sensitivity(&mut self, sensitivity: f32) -> Result<()>;
}

// speech/mod.rs
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

pub fn create_adapter() -> Box<dyn SpeechScrollAdapter> {
    #[cfg(target_os = "macos")]
    { Box::new(macos::SFSpeechAdapter::new()) }

    #[cfg(target_os = "windows")]
    { Box::new(windows::SileroVadAdapter::new()) }
}
```

### Pattern 2: Event-Driven Scroll Updates (Rust to Frontend)

**What:** The Scroll Controller runs in Rust (on a background thread), consumes speech adapter events, computes scroll position, and emits targeted events to the overlay window using `app.emit_to()`.
**When to use:** Any continuous data stream from Rust to a specific frontend window (scroll position, speech status, progress).
**Trade-offs:** Events are not type-safe by default (use tauri-specta for type safety). Events are one-way (Rust to frontend). Low latency compared to polling via commands.

**Example:**
```rust
// In scroll controller thread
fn on_speech_event(app: &AppHandle, event: SpeechScrollEvent) {
    let new_position = compute_scroll_position(event);
    // Emit only to the overlay window, not the main window
    app.emit_to(
        EventTarget::labeled("overlay"),
        "scroll-update",
        ScrollPayload { position: new_position, highlight_range: ... }
    ).ok();
}
```

```typescript
// In overlay React component
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<ScrollPayload>('scroll-update', (event) => {
    setScrollPosition(event.payload.position);
    setHighlightRange(event.payload.highlight_range);
  });
  return () => { unlisten.then(f => f()); };
}, []);
```

### Pattern 3: Command-Based Request/Response (Frontend to Rust)

**What:** Frontend invokes Rust functions via `invoke()` for discrete operations (save script, start speech, change settings). Commands are type-safe, support arguments, return values, and can be async.
**When to use:** Any discrete user action that needs Rust processing: file operations, starting/stopping speech, changing settings.
**Trade-offs:** JSON serialization overhead (negligible for small payloads). Commands block the calling context until resolved (use async for long operations). All arguments and return types must be `Serialize`/`Deserialize`.

**Example:**
```rust
#[tauri::command]
async fn start_speech(
    state: tauri::State<'_, Mutex<AppState>>,
    sensitivity: f32
) -> Result<(), String> {
    let mut app_state = state.lock().map_err(|e| e.to_string())?;
    app_state.speech_adapter.set_sensitivity(sensitivity)
        .map_err(|e| e.to_string())?;
    app_state.speech_adapter.start(/* callback */)
        .map_err(|e| e.to_string())
}
```

### Pattern 4: Per-Window Capabilities (Principle of Least Privilege)

**What:** Tauri 2 defines capabilities per window label. The overlay window gets minimal permissions; the main window gets full permissions.
**When to use:** Any multi-window app. Always.
**Trade-offs:** Adds configuration files, but dramatically improves security posture. Required for store submission.

**Example:**
```json
// capabilities/overlay-window.json
{
  "identifier": "overlay-capability",
  "description": "Minimal permissions for the teleprompter overlay",
  "windows": ["overlay"],
  "permissions": [
    "event:default"
  ]
}
```

```json
// capabilities/main-window.json
{
  "identifier": "main-capability",
  "description": "Full permissions for the main editor window",
  "windows": ["main"],
  "permissions": [
    "event:default",
    "core:default",
    "dialog:default",
    "fs:default"
  ]
}
```

### Pattern 5: Dedicated Audio Thread with Channel Communication

**What:** Audio capture (via cpal) runs on a dedicated thread. Speech processing runs on another thread. They communicate via channels (`std::sync::mpsc` or `crossbeam`). This prevents audio glitches from processing latency.
**When to use:** Real-time audio processing in desktop apps.
**Trade-offs:** More complex threading model. On macOS, cpal streams cannot be moved between threads (CoreAudio constraint), so the audio thread must create and own the stream.

## Data Flow

### Primary Data Flows

```
1. SCRIPT EDITING (user types → saved to disk)
   User Input → React Editor → invoke("save_script") → Rust → filesystem
                                                        ↓
                                                   emit("script-saved") → Main Window store

2. TELEPROMPTER LAUNCH (user clicks "Start")
   Click → invoke("start_overlay") → Rust creates overlay window
                                      ↓
   invoke("start_speech") → Rust starts adapter → adapter thread runs
                                                    ↓
   SpeechScrollEvent → ScrollController → emit_to("overlay", "scroll-update")
                                           ↓
   Overlay Window listens → updates scroll position + highlight

3. SPEECH → SCROLL (continuous real-time loop)

   macOS path:
   Microphone → SFSpeechRecognizer → word transcription
       ↓
   SpeechScrollEvent::WordRecognized { word, timestamp }
       ↓
   ScrollController: match word to script position → compute scroll target
       ↓
   emit_to("overlay", "scroll-update", { position, highlight_range })

   Windows path:
   Microphone → cpal capture → audio chunks
       ↓
   Silero VAD inference → voice activity probability
       ↓
   SpeechScrollEvent::VoiceActivity { probability, is_speech }
       ↓
   ScrollController: speech → increase speed, silence → pause
       ↓
   emit_to("overlay", "scroll-update", { position, speed })

4. MANUAL CONTROLS (keyboard shortcuts)
   Keypress → invoke("scroll_step", { direction: "back", unit: "sentence" })
       ↓
   Rust ScrollController adjusts position
       ↓
   emit_to("overlay", "scroll-update", { position, ... })
```

### State Management Strategy

```
                    SOURCE OF TRUTH
                    ================
Frontend (Zustand)          Rust (tauri::State)
- UI-only state             - Script content & metadata
  (panel sizes,             - Scroll position
   editor cursor,           - Speech adapter state
   preview toggle)          - Overlay window state
                            - User settings (persisted)

                    SYNC MECHANISM
                    ==============
Frontend → Rust:    invoke() commands (user actions)
Rust → Frontend:    emit() / emit_to() events (state changes)
```

The Rust backend is the single source of truth for all application state. Frontend stores hold only UI-local state (which panel is open, cursor position, preview visibility). When the user performs an action (save script, start speech), the frontend invokes a Rust command. Rust processes the action, updates its state, and emits events back to the relevant windows. Frontend stores update on event receipt.

This prevents state desynchronization between windows. Both the main window and overlay window receive state updates from the same Rust source.

### Key Data Flows Summary

1. **Script editing:** Frontend → `invoke()` → Rust filesystem → `emit()` → both windows
2. **Speech scrolling:** Microphone → Rust adapter → ScrollController → `emit_to("overlay")` → overlay
3. **Manual controls:** Keypress → `invoke()` → Rust ScrollController → `emit_to("overlay")` → overlay
4. **Settings changes:** Frontend → `invoke()` → Rust persist → `emit()` → both windows
5. **Overlay lifecycle:** Frontend → `invoke("start_overlay")` → Rust creates window → overlay mounts

## Anti-Patterns

### Anti-Pattern 1: Frontend as Source of Truth for Shared State

**What people do:** Store scroll position, speech state, or script data in Zustand and sync between windows via Tauri events frontend-to-frontend.
**Why it's wrong:** Two windows = two React trees = two Zustand instances. They will drift. Race conditions when both windows try to update the same state. No single source of truth.
**Do this instead:** Rust backend owns all shared state. Both windows invoke commands and listen to events from Rust. Frontend stores only hold UI-local state.

### Anti-Pattern 2: One Monolithic Window with Overlay as DOM Element

**What people do:** Render the teleprompter as a React component inside the main window, positioned with CSS over the desktop.
**Why it's wrong:** A DOM element cannot be always-on-top of other desktop apps. Cannot be made invisible to screen capture. Cannot be dragged independently. Cannot have separate capabilities/permissions.
**Do this instead:** The overlay must be a separate Tauri window (separate OS-level window) with its own HTML entry point. This is required for always-on-top, screen-capture exclusion, independent positioning, and per-window capabilities.

### Anti-Pattern 3: Polling Rust from Frontend for Real-Time Data

**What people do:** Call `invoke("get_scroll_position")` on a `setInterval` timer to get the current scroll position.
**Why it's wrong:** Polling at 60fps means 60 IPC round-trips per second. Each round-trip has JSON serialization overhead. Introduces latency jitter. Wastes CPU.
**Do this instead:** Use Tauri's event system. Rust emits `scroll-update` events to the overlay window only when the position changes. The overlay listens and updates. Push model, not pull.

### Anti-Pattern 4: Blocking the Main Thread with Speech Processing

**What people do:** Run SFSpeechRecognizer callbacks or Silero VAD inference on the Tauri command thread.
**Why it's wrong:** Tauri commands run on a thread pool. Long-running speech processing blocks threads needed for other commands. On macOS, CoreAudio callbacks must stay on the thread that created the stream.
**Do this instead:** Speech processing runs on a dedicated background thread spawned at `start_speech`. It communicates with the Scroll Controller via channels. The Scroll Controller emits events to the frontend. Command threads remain free.

### Anti-Pattern 5: Putting Platform-Specific Code in Commands

**What people do:** Write `#[cfg(target_os = "macos")]` blocks directly in command handlers.
**Why it's wrong:** Commands become unmaintainable spaghetti of platform conditionals. Hard to test. Violates single responsibility.
**Do this instead:** Commands call into domain modules. Platform-specific logic lives in the adapter/speech module behind traits. Commands are platform-agnostic.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Direction | Notes |
|----------|---------------|-----------|-------|
| Main Window <-> Rust | invoke() / emit() | Bidirectional | Commands for actions, events for state updates |
| Overlay Window <-> Rust | emit_to() / listen | Rust -> Overlay (mostly) | Overlay receives scroll updates; minimal invoke usage |
| Scroll Controller <-> Speech Adapter | Channel (mpsc) | Adapter -> Controller | Speech events flow to controller for processing |
| Speech Adapter <-> Audio (Windows) | Channel (mpsc) | Audio -> Adapter | cpal audio chunks sent to VAD on separate thread |
| Speech Adapter <-> OS (macOS) | objc2 callback | OS -> Adapter | SFSpeechRecognizer delegates call into Rust |
| Commands <-> App State | Mutex<AppState> | Bidirectional | Commands read/write shared state under lock |

### Platform-Native Integration Points

| Platform | API | Rust Crate | Purpose | Confidence |
|----------|-----|-----------|---------|------------|
| macOS | SFSpeechRecognizer | `objc2-speech` | On-device speech recognition | HIGH - crate exists, API documented |
| macOS | NSWindow.sharingType | `objc2-app-kit` | Screen capture exclusion | LOW - broken on macOS 15+ (see Pitfalls) |
| Windows | SetWindowDisplayAffinity | `windows` crate | Screen capture exclusion | MEDIUM - works on most Win 10/11, some subset fails |
| Windows | Silero VAD | `silero-vad-rs` | Voice activity detection | HIGH - mature crate, bundles ONNX model |
| Both | cpal | `cpal` | Microphone audio capture | HIGH - mature, but macOS signing issue exists |

## Build Order Implications

Based on component dependencies, the recommended build sequence is:

### Phase 1: Foundation (No Platform-Specific Code)
Build first because everything depends on this:
- Tauri 2 project scaffolding with multi-window config
- Main window React shell with glassmorphic UI primitives
- Script editor (markdown editor + preview)
- File tree sidebar with local filesystem storage
- Vite multi-entry configuration (main + overlay entry points)

**Rationale:** The editor is the most complex UI component and has zero platform dependencies. Building it first establishes the glassmorphic design system and Zustand patterns that the overlay reuses.

### Phase 2: Overlay Window + IPC Plumbing
Build next because speech/scroll depend on having an overlay target:
- Overlay window creation from Rust (WebviewWindowBuilder)
- Always-on-top, transparent background, draggable
- Per-window capabilities configuration
- Tauri IPC command/event patterns (invoke + emit_to)
- Manual scroll controls via keyboard shortcuts (no speech yet)
- Classic auto-scroll mode (fixed speed fallback)

**Rationale:** This establishes the multi-window architecture and IPC patterns. Manual scroll + auto-scroll proves the overlay works before adding speech complexity.

### Phase 3: Screen Capture Exclusion
Build separately because this is the highest-risk component:
- macOS: NSWindow.sharingType = .none (works on macOS <=14; broken on 15+)
- Windows: SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
- Verification testing on Zoom, Teams, Meet, OBS

**Rationale:** This is the product's core value proposition and the component with the highest technical risk. The macOS 15+ ScreenCaptureKit issue is a potential blocker that must be validated before investing in speech. If screen-hide is fundamentally broken on modern macOS, the product strategy must adapt.

### Phase 4: Speech Integration
Build last because it depends on overlay + IPC being solid:
- SpeechScrollAdapter trait definition
- macOS: SFSpeechRecognizer integration via objc2-speech
- Windows: Silero VAD via silero-vad-rs + cpal audio capture
- Scroll Controller consuming adapter events
- Real-time scroll updates emitted to overlay

**Rationale:** Speech is the most complex subsystem with the most platform-specific code. It requires working overlay (Phase 2), working IPC (Phase 2), and ideally validated screen-hide (Phase 3). Building it last means all integration points are proven.

### Phase 5: Polish + Store Readiness
- App sandboxing and entitlements (macOS App Sandbox)
- Code signing (macOS + Windows)
- microphone permission handling (Info.plist, runtime prompts)
- Settings persistence
- Light/dark mode theming

## Sources

### Official Tauri 2 Documentation
- [Project Structure](https://v2.tauri.app/start/project-structure/) - File organization and entry points
- [Architecture Concepts](https://v2.tauri.app/concept/architecture/) - Core architecture overview
- [Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/) - IPC command system
- [Calling Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/) - Event emission
- [IPC Concepts](https://v2.tauri.app/concept/inter-process-communication/) - Message passing model
- [Plugin Development](https://v2.tauri.app/develop/plugins/) - Plugin architecture
- [State Management](https://v2.tauri.app/develop/state-management/) - Rust-side state
- [Capabilities](https://v2.tauri.app/security/capabilities/) - Per-window security
- [Capabilities for Windows/Platforms](https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/) - Multi-window security model
- [Window Customization](https://v2.tauri.app/learn/window-customization/) - Transparent, always-on-top
- [App Store Distribution](https://v2.tauri.app/distribute/app-store/) - Store submission guide
- [macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/) - Signing and entitlements

### Platform APIs
- [NSWindow.SharingType.none](https://developer.apple.com/documentation/appkit/nswindow/sharingtype-swift.enum/none) - Apple docs (deprecated behavior on macOS 15+)
- [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer) - Apple speech recognition
- [SetWindowDisplayAffinity](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowdisplayaffinity) - Windows screen capture exclusion
- [objc2-speech crate](https://docs.rs/objc2-speech/latest/objc2_speech/) - Rust bindings for Apple Speech framework
- [objc2-app-kit NSWindow](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSWindow.html) - Rust bindings for NSWindow

### Rust Crates
- [silero-vad-rs](https://crates.io/crates/silero-vad-rs) - Silero VAD with ONNX runtime
- [cpal](https://github.com/RustAudio/cpal) - Cross-platform audio I/O
- [tauri-specta](https://github.com/specta-rs/tauri-specta) - Type-safe Tauri commands

### Critical Issues
- [Tauri #14200: macOS 15+ ScreenCaptureKit ignores sharingType](https://github.com/tauri-apps/tauri/issues/14200) - Screen capture protection broken on macOS 15+
- [Tauri #13070: Transparent window click-through support](https://github.com/tauri-apps/tauri/issues/13070) - Click-through not yet configurable
- [Apple Developer Forums: macOS 15.4+ sharingType broken](https://developer.apple.com/forums/thread/792152) - Apple confirmation
- [Tauri #9928: Microphone access on macOS](https://github.com/tauri-apps/tauri/issues/9928) - cpal + code signing permission issue

### Community Resources
- [dannysmith/tauri-template](https://github.com/dannysmith/tauri-template) - Production-ready Tauri v2 + React template with multi-window
- [How Interview Cheating Tools Hide from Zoom](https://adamsvoboda.net/how-interview-cheating-tools-hide-from-zoom/) - Technical analysis of screen-hide techniques
- [Building a (kind of) invisible mac app](https://pierce.dev/notes/building-a-kind-of-invisible-mac-app) - NSWindow level and sharing type analysis
- [Tauri at Scale: Multi-Window](https://medium.com/@hadiyolworld007/tauri-at-scale-building-multi-window-desktop-apps-without-the-bloat-e17676b906c6) - Multi-window patterns

---
*Architecture research for: Steadi cross-platform invisible teleprompter*
*Researched: 2026-02-15*
