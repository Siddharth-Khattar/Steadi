# Phase 1: Platform Validation Spike - Research

**Researched:** 2026-02-15
**Domain:** Tauri v2 multi-window overlay, screen capture exclusion (macOS + Windows), glassmorphic vibrancy
**Confidence:** MEDIUM (HIGH for Tauri APIs, MEDIUM for macOS 15+ invisibility, HIGH for Windows approach)

## Summary

Phase 1 must prove that an always-on-top transparent overlay window can be made invisible to screen sharing on both macOS and Windows. This is the highest-risk technical validation in the entire project. Research reveals that the macOS 15+ situation is more nuanced than a simple "broken" -- `content_protected` / `sharingType = .none` blocks legacy `CGWindowListCreateImage` APIs but NOT the newer ScreenCaptureKit, and conferencing apps are at varying stages of migrating to ScreenCaptureKit. The practical invisibility today depends on which capture API each app version uses, which varies. Windows has a separate documented conflict between `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` and WebView2 transparent windows, but this was reportedly fixed in 2021.

Tauri v2 provides first-class APIs for everything needed: `content_protected`, `transparent`, `always_on_top`, `decorations(false)`, `set_ignore_cursor_events`, and a built-in `EffectsBuilder` for native vibrancy effects. The overlay should be created dynamically from Rust via `WebviewWindowBuilder` with a separate HTML entry point, keeping its bundle minimal.

**Primary recommendation:** Build the overlay with Tauri's `content_protected(true)` + native vibrancy effects, then immediately test against Zoom, Teams, Meet, and OBS on macOS 14, macOS 15, and Windows. If macOS 15+ fails for specific apps, investigate whether those apps offer "share window" (vs "share screen") modes that still use legacy APIs, and document a compatibility matrix. This is a spike -- the goal is to discover what works, not to ship a polished product.

## Standard Stack

Phase 1 uses a minimal subset of the full Steadi stack. Only what is needed for the spike.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.10.x | App framework with native window APIs | Built-in `content_protected`, `transparent`, `always_on_top`, `effects` APIs |
| React | 19.x | UI for both main and overlay windows | Established in project constraints |
| TypeScript | 5.9.x | Type safety | Project constraint |
| Vite | 7.x | Build tool with multi-page support | Default for Tauri + React; `build.rollupOptions.input` for multiple HTML entries |
| Tailwind CSS | 4.x | Styling for glassmorphic overlay text/layout | `backdrop-blur`, opacity utilities layer on top of native vibrancy |
| Rust | stable 1.84+ | Backend for window management and platform code | Required by Tauri |

### Supporting (Phase 1 only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tauri-plugin-global-shortcut | 2.x | Register toggle-visibility keyboard shortcut | System-wide shortcut to show/hide overlay for screen share testing |
| window-vibrancy | 0.7.x | Fallback if Tauri built-in effects insufficient | Only if `EffectsBuilder` does not provide enough control over vibrancy materials |

### NOT Needed in Phase 1

| Library | Why Not Yet |
|---------|-------------|
| Zustand | No shared state between windows yet; overlay shows static content |
| react-markdown | No markdown rendering in Phase 1; plain styled text only |
| CodeMirror | No editor in Phase 1 |
| tauri-plugin-store | No persistence in Phase 1 |
| tauri-plugin-sql | No script storage in Phase 1 |
| objc2-speech / cpal / ort | No voice processing in Phase 1 |

### Installation (Phase 1)

```bash
# Create Tauri 2 project with React + TypeScript
npm create tauri-app@latest steadi -- --template react-ts

# Phase 1 frontend dependencies (minimal)
npm install tailwindcss @tailwindcss/vite
npm install @tauri-apps/plugin-global-shortcut

# Dev dependencies
npm install -D @tauri-apps/cli typescript @types/react @types/react-dom
```

```toml
# src-tauri/Cargo.toml - Phase 1 only
[dependencies]
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-global-shortcut = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Only if Tauri built-in effects are insufficient
# window-vibrancy = "0.7"
```

## Architecture Patterns

### Recommended Phase 1 Project Structure

```
steadi/
├── src/                          # React frontend
│   ├── main/                     # Main window entry
│   │   ├── App.tsx               # Main window: controls to toggle overlay
│   │   ├── index.html            # Main window HTML entry
│   │   └── main.tsx              # React mount for main window
│   ├── overlay/                  # Overlay window entry (separate bundle)
│   │   ├── App.tsx               # Overlay: static teleprompter text display
│   │   ├── index.html            # Overlay HTML entry
│   │   └── main.tsx              # React mount for overlay window
│   ├── components/
│   │   └── ui/                   # Glassmorphic primitives
│   │       └── GlassPanel.tsx    # Reusable frosted glass container
│   └── styles/
│       └── globals.css           # Tailwind + transparent body styles
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Main window config; macOSPrivateApi: true
│   ├── capabilities/
│   │   ├── main-window.json      # Full permissions for main window
│   │   └── overlay-window.json   # Minimal permissions for overlay
│   └── src/
│       ├── main.rs               # Entry point
│       ├── lib.rs                 # Builder setup: plugins, commands, state
│       ├── commands.rs            # toggle_overlay, show_overlay, hide_overlay
│       └── overlay.rs            # Overlay window creation + platform config
├── package.json
├── vite.config.ts                # Multi-page: main + overlay entries
└── tsconfig.json
```

### Pattern 1: Multi-Page Vite Configuration

**What:** Configure Vite to produce two separate bundles -- one for the main window and one for the overlay -- so the overlay bundle is minimal (no editor code, no heavy deps).

**Example:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main/index.html'),
        overlay: resolve(__dirname, 'src/overlay/index.html'),
      },
    },
  },
});
```

### Pattern 2: Dynamic Overlay Window Creation from Rust

**What:** Create the overlay window programmatically from Rust using `WebviewWindowBuilder`, not statically in `tauri.conf.json`. This gives full control over platform-specific properties like `content_protected`, vibrancy effects, and exact positioning.

**When to use:** Always for the overlay. Static config in `tauri.conf.json` is fine for the main window.

**Example:**
```rust
// overlay.rs
use tauri::webview::{WebviewUrl, WebviewWindowBuilder};
use tauri::window::{Color, Effect, EffectState, EffectsBuilder};
use tauri::{AppHandle, Manager};

pub fn create_overlay(app: &AppHandle) -> tauri::Result<()> {
    // Get primary monitor dimensions for positioning
    let monitor = app
        .primary_monitor()?
        .expect("No primary monitor found");
    let screen_width = monitor.size().width as f64 / monitor.scale_factor();
    let overlay_width = screen_width * 0.55; // ~55% of screen width
    let overlay_height = 160.0; // 4-6 lines of text
    let x = (screen_width - overlay_width) / 2.0;
    let y = 0.0; // Top of screen, hugging notch area

    let effects = EffectsBuilder::new()
        .effect(Effect::HudWindow)   // Dark translucent material on macOS
        .effect(Effect::Acrylic)     // Fallback for Windows
        .state(EffectState::Active)  // Always active, even when unfocused
        .radius(10.0)               // Rounded corners (8-12px range)
        .color(Color(0, 0, 0, 200)) // Dark smoke tint
        .build();

    WebviewWindowBuilder::new(
        app,
        "overlay",
        WebviewUrl::App("overlay/index.html".into()),
    )
    .title("Steadi Overlay")
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .shadow(false)
    .skip_taskbar(true)
    .resizable(false)
    .content_protected(true)   // Screen capture exclusion
    .inner_size(overlay_width, overlay_height)
    .position(x, y)
    .effects(effects)
    .build()?;

    Ok(())
}
```

### Pattern 3: Toggle Overlay Visibility via Global Shortcut

**What:** Register a system-wide keyboard shortcut that shows/hides the overlay. Essential for screen-share testing -- toggle overlay on, start screen share, verify it does not appear.

**Example:**
```rust
// lib.rs
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(overlay) = app.webview_windows().get("overlay") {
                            if overlay.is_visible().unwrap_or(false) {
                                overlay.hide().ok();
                            } else {
                                overlay.show().ok();
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Register Cmd+Shift+S (macOS) / Ctrl+Shift+S (Windows)
            let shortcut = Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT),
                Code::KeyS,
            );
            app.global_shortcut().register(shortcut)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Pattern 4: Transparent Body + Native Vibrancy Layering

**What:** The overlay HTML/CSS has a fully transparent background. The frosted-glass effect comes from Tauri's native vibrancy API (NSVisualEffectView on macOS, Acrylic on Windows), NOT from CSS `backdrop-filter`. CSS provides text styling, layout, and semi-transparent overlays ON TOP of the native vibrancy.

**Example:**
```css
/* overlay globals.css */
@import "tailwindcss";

html, body {
  background: transparent;
  margin: 0;
  padding: 0;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
```

```tsx
// overlay/App.tsx
function OverlayApp() {
  return (
    <div className="w-full h-full flex items-start justify-center p-4">
      <div className="max-w-[90%] text-center">
        <p className="text-white/95 text-lg font-medium leading-relaxed drop-shadow-sm">
          {/* Static demo teleprompter text */}
          Welcome to today's quarterly review. I want to start by
          thanking everyone for their hard work this quarter...
        </p>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **CSS `backdrop-filter: blur()` for frosted glass effect:** Does NOT blur the desktop behind the Tauri window. Only blurs content within the webview. Use native vibrancy APIs instead. This is a well-documented Tauri limitation (issues #12804, #12437, #6876).
- **Static overlay window in `tauri.conf.json`:** Limits control over platform-specific properties. Create dynamically from Rust for full `WebviewWindowBuilder` API access.
- **Single window with overlay as DOM element:** Cannot be always-on-top of other apps, cannot be made invisible to screen capture, cannot have independent permissions.
- **Testing only in `tauri dev` mode:** Transparency and content protection behavior can differ between dev and production builds. Always test with `tauri build`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screen capture exclusion | Custom native window manipulation | `content_protected(true)` on `WebviewWindowBuilder` | Tauri wraps `NSWindow.sharingType = .none` (macOS) and `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` (Windows) |
| Frosted glass / vibrancy | CSS `backdrop-filter` hacks | `EffectsBuilder` with `Effect::HudWindow` (macOS) / `Effect::Acrylic` (Windows) | Native APIs provide true desktop blur; CSS blur only affects webview content |
| Always-on-top floating window | NSWindow level manipulation via objc2 | `.always_on_top(true)` on `WebviewWindowBuilder` | Tauri handles the cross-platform abstraction |
| System-wide keyboard shortcut | Raw OS hotkey registration | `tauri-plugin-global-shortcut` | Official plugin, handles registration/unregistration lifecycle, cross-platform |
| Window positioning near notch | Manual screen geometry calculation | `app.primary_monitor()` for screen dimensions + calculated position | Tauri provides monitor info; position is computed relative to screen width |
| Click-through behavior | Platform-specific pointer event passthrough | `set_ignore_cursor_events(true/false)` on `Window` | Built-in Tauri method; can toggle dynamically |

**Key insight:** Tauri v2 has absorbed most of the functionality that previously required separate plugins or raw native API calls. The `WebviewWindowBuilder` and `Window` structs provide `content_protected`, `transparent`, `always_on_top`, `effects`, `set_ignore_cursor_events`, and `decorations` -- everything needed for the overlay.

## Common Pitfalls

### Pitfall 1: macOS 15+ Content Protection Does Not Block ScreenCaptureKit

**What goes wrong:** `NSWindow.sharingType = .none` (which Tauri's `content_protected(true)` sets under the hood) only blocks legacy `CGWindowListCreateImage` capture APIs. On macOS 15 (Sequoia), `CGWindowListCreateImage` is obsoleted and Apple pushes apps to use ScreenCaptureKit, which ignores `sharingType`. As conferencing apps migrate to ScreenCaptureKit, the overlay becomes visible in screen shares.

**Why it happens:** Apple changed the compositing model in macOS 15. All window contents are composited into a single framebuffer before display. ScreenCaptureKit captures this framebuffer, bypassing per-window sharing flags. This is confirmed by Apple in developer forums and tracked in Tauri issue #14200.

**How to avoid:**
1. **Test empirically on macOS 15+ against each target app.** The invisibility depends on which capture API each app currently uses. Some may still use legacy APIs or offer sharing modes that respect `sharingType`.
2. **Distinguish between "share entire screen" and "share specific window."** When a user shares a specific app window (e.g., a Chrome tab), the conferencing app may use `SCContentFilter` with window-level filtering, which could exclude windows with `sharingType = .none`. When sharing the entire display, the full framebuffer is captured and content protection is ignored.
3. **Build a compatibility matrix** during the spike: for each app (Zoom, Teams, Meet, OBS) x each sharing mode (screen, window) x each macOS version (14, 15), document whether the overlay is visible.
4. **Notchie (the inspiration app) claims to still work** on macOS with Zoom, Meet, Teams, OBS. Their marketing says it uses "macOS overlay layers that screen-sharing APIs ignore" and operates at a "display level that bypasses the screen capture APIs." This is likely a combination of `sharingType = .none` plus specific window level positioning. The fact that Notchie still advertises compatibility suggests either (a) the apps they test against haven't fully migrated to ScreenCaptureKit for all modes, or (b) there is a technique beyond simple `sharingType` that still works. The spike must investigate this.
5. **Accept graceful degradation.** If some apps on macOS 15+ capture the overlay, document the limitation and inform users. The overlay still has value even when visible (voice-synced scrolling, text positioning).

**Warning signs:** Overlay appears in screen recordings on macOS 15+. Conferencing app updates suddenly capture the overlay.

**Confidence:** LOW for macOS 15+ invisibility. The research is contradictory -- Apple says there is no workaround, but Notchie still claims to work. Empirical testing during the spike is the only reliable way to resolve this.

### Pitfall 2: Transparent Window Loses Transparency After Production Build on macOS

**What goes wrong:** Windows that are transparent in `tauri dev` render with an opaque white or black background after `tauri build` and DMG packaging. Tracked in Tauri issue #13415.

**Why it happens:** The transparency flag does not consistently propagate through the macOS bundling pipeline. Additionally, focus-change causes visual glitches on transparent windows (Tauri issue #8255).

**How to avoid:**
1. **Enable `macOSPrivateApi: true`** in `tauri.conf.json` -- this is required for transparent windows on macOS.
2. **Set transparency in both Tauri config AND in the HTML/CSS.** `html, body { background: transparent; }` must be set.
3. **Test production builds from the first day.** Run `tauri build` and test the DMG after every visual change.
4. **As a safety net, use Rust to programmatically enforce transparency** on the window after creation (via raw NSWindow access if needed).

**Warning signs:** Works in dev, breaks in build. White/black flash when switching focus.

### Pitfall 3: WebView2 + SetWindowDisplayAffinity Conflict on Windows

**What goes wrong:** `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` was documented to cause `COMException` crashes in WebView2 during navigation events. Separately, `WDA_EXCLUDEFROMCAPTURE` fails when `AllowTransparency` is enabled on a window, returning 0 (failure).

**Why it happens:** WebView2's Chromium-based compositor conflicts with display affinity flags. Transparency + display affinity both modify DWM compositor behavior.

**How to avoid:**
1. **Test on Windows immediately** in Phase 1. The combination of transparent Tauri window + WebView2 + `content_protected(true)` must be validated.
2. The WebView2 COMException bug was reportedly fixed by Microsoft in March 2021 (issue #841 closed as COMPLETED). Verify the fix applies to current WebView2 Runtime versions.
3. **If `WDA_EXCLUDEFROMCAPTURE` fails with transparency,** test without transparency first (opaque dark background) to isolate the issue. If display affinity only works without transparency, consider a non-transparent dark overlay as fallback.
4. **Runtime detection:** Check the return value of `SetWindowDisplayAffinity`. If it returns 0, inform the user that invisibility is not available on their system.
5. **Note:** On a subset of Windows 11 machines, both `WDA_EXCLUDEFROMCAPTURE` and `WDA_MONITOR` fail entirely. This is a known Microsoft issue with no workaround.

**Warning signs:** Overlay visible in Windows screen shares. `content_protected(true)` silently fails. Works on dev machine but fails on other Windows builds.

### Pitfall 4: macOSPrivateApi Required for Transparency

**What goes wrong:** Setting `transparent: true` on a window has no effect without enabling `macOSPrivateApi: true` in `tauri.conf.json`. The window remains opaque.

**Why it happens:** Tauri gates the transparent background API behind the `macos-private-api` feature flag because it uses a private macOS API to achieve transparency.

**How to avoid:**
1. **Set `macOSPrivateApi: true` in `tauri.conf.json`** under `app`.
2. **Enable `macos-private-api` feature** in `Cargo.toml`: `tauri = { version = "2", features = ["macos-private-api"] }`.
3. Both must be set. Missing either one silently disables transparency.

**Impact on App Store:** Using `macOSPrivateApi` may cause App Store rejection. However, this is deferred -- Phase 1 distributes via GitHub releases, not the App Store. If App Store submission becomes necessary, investigate whether the transparency API has become public in newer macOS versions or find alternatives.

### Pitfall 5: Effect Conflicts Between Platforms

**What goes wrong:** The `EffectsBuilder` accepts a list of effects, but macOS effects (e.g., `Effect::HudWindow`) are ignored on Windows, and Windows effects (e.g., `Effect::Acrylic`) are ignored on macOS. If only one platform's effect is specified, the other platform gets no vibrancy.

**Why it happens:** Each `Effect` variant maps to a specific platform API. Tauri applies the first applicable effect and ignores the rest.

**How to avoid:**
1. **Specify effects for both platforms in the effects list.** The first applicable effect for the current platform is used; the rest are silently ignored.
2. Recommended combination: `Effect::HudWindow` (macOS 10.14+) + `Effect::Acrylic` (Windows 10/11).
3. Use `.state(EffectState::Active)` to keep the vibrancy effect active even when the overlay is unfocused -- essential for an always-on-top overlay.

```rust
let effects = EffectsBuilder::new()
    .effect(Effect::HudWindow)   // macOS: dark translucent HUD material
    .effect(Effect::Acrylic)     // Windows: acrylic blur effect
    .state(EffectState::Active)
    .radius(10.0)
    .color(Color(0, 0, 0, 200))
    .build();
```

## Code Examples

### Complete Overlay Window Creation (Rust)

```rust
// src-tauri/src/overlay.rs
// ABOUTME: Creates and manages the invisible glassmorphic overlay window
// ABOUTME: with platform-specific screen capture exclusion and vibrancy effects.

use tauri::webview::{WebviewUrl, WebviewWindowBuilder};
use tauri::window::{Color, Effect, EffectState, EffectsBuilder};
use tauri::{AppHandle, Manager, WebviewWindow};

/// Creates the overlay window with invisibility and vibrancy settings.
///
/// The overlay is:
/// - Transparent with native vibrancy (frosted glass)
/// - Always on top of other windows
/// - Protected from screen capture (content_protected)
/// - Positioned at top-center of screen (notch-style)
/// - Borderless with rounded corners via vibrancy radius
pub fn create_overlay(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let monitor = app
        .primary_monitor()?
        .expect("No primary monitor found");

    let scale = monitor.scale_factor();
    let screen_width = monitor.size().width as f64 / scale;
    let overlay_width = screen_width * 0.55;
    let overlay_height = 160.0;
    let x = (screen_width - overlay_width) / 2.0;
    let y = 0.0;

    let effects = EffectsBuilder::new()
        .effect(Effect::HudWindow)
        .effect(Effect::Acrylic)
        .state(EffectState::Active)
        .radius(10.0)
        .color(Color(0, 0, 0, 200))
        .build();

    let overlay = WebviewWindowBuilder::new(
        app,
        "overlay",
        WebviewUrl::App("overlay/index.html".into()),
    )
    .title("Steadi Overlay")
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .shadow(false)
    .skip_taskbar(true)
    .resizable(false)
    .visible(true)
    .content_protected(true)
    .inner_size(overlay_width, overlay_height)
    .position(x, y)
    .effects(effects)
    .build()?;

    Ok(overlay)
}

/// Toggles overlay visibility. Returns the new visibility state.
pub fn toggle_overlay(app: &AppHandle) -> tauri::Result<bool> {
    if let Some(overlay) = app.webview_windows().get("overlay") {
        let visible = overlay.is_visible()?;
        if visible {
            overlay.hide()?;
        } else {
            overlay.show()?;
        }
        Ok(!visible)
    } else {
        // Overlay doesn't exist yet; create it
        create_overlay(app)?;
        Ok(true)
    }
}
```

### tauri.conf.json Configuration

```json
{
  "productName": "Steadi",
  "version": "0.1.0",
  "identifier": "com.steadi.app",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "macOSPrivateApi": true,
    "withGlobalTauri": false,
    "windows": [
      {
        "label": "main",
        "title": "Steadi",
        "url": "main/index.html",
        "width": 600,
        "height": 400,
        "center": true,
        "resizable": true,
        "decorations": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### Vite Multi-Page Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main/index.html'),
        overlay: resolve(__dirname, 'src/overlay/index.html'),
      },
    },
  },
});
```

### Overlay HTML Entry Point

```html
<!-- src/overlay/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Steadi Overlay</title>
    <style>
      html, body { background: transparent; margin: 0; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Global Shortcut Registration (Complete lib.rs)

```rust
// src-tauri/src/lib.rs
// ABOUTME: Tauri application entry point. Initializes plugins, registers
// ABOUTME: global shortcuts, and sets up Tauri command handlers.

mod commands;
mod overlay;

use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        overlay::toggle_overlay(app).ok();
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::toggle_overlay,
            commands::create_overlay,
        ])
        .setup(|app| {
            // Cmd+Shift+S on macOS, Ctrl+Shift+S on Windows
            let toggle_shortcut = Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT),
                Code::KeyS,
            );
            app.global_shortcut().register(toggle_shortcut)?;

            // Create overlay on startup
            overlay::create_overlay(app.handle())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Per-Window Capabilities

```json
// src-tauri/capabilities/main-window.json
{
  "identifier": "main-capability",
  "description": "Permissions for the main control window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```

```json
// src-tauri/capabilities/overlay-window.json
{
  "identifier": "overlay-capability",
  "description": "Minimal permissions for the teleprompter overlay",
  "windows": ["overlay"],
  "permissions": [
    "core:default"
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window-vibrancy` crate (separate) | Tauri built-in `EffectsBuilder` + `Effect` enum | Tauri 2.0 | No need for external crate; effects configured via `WebviewWindowBuilder` |
| `CGWindowListCreateImage` (macOS) | ScreenCaptureKit (`SCContentFilter`) | macOS 14 deprecated, macOS 15 obsoleted | `sharingType = .none` only blocks legacy API; ScreenCaptureKit ignores it |
| `NSWindow.sharingType` alone | Unknown (Notchie claims overlay-layer approach) | macOS 15+ | May need additional techniques beyond `sharingType` for full invisibility |
| `winapi` crate (Windows APIs) | `windows-rs` crate (Microsoft official) | 2022+ | `windows-rs` is maintained by Microsoft; `winapi` is abandoned |
| CSS `backdrop-filter: blur()` | Native vibrancy APIs | Always for desktop apps | CSS blur only works within webview, not against desktop content |

**Deprecated/outdated:**
- `CGWindowListCreateImage`: Deprecated macOS 14, obsoleted macOS 15. Apps must migrate to ScreenCaptureKit.
- `NSVisualEffectMaterial.light/dark/mediumLight/ultraDark`: Deprecated macOS 10.14. Use semantic materials: `hudWindow`, `popover`, `windowBackground`, etc.
- `window-vibrancy` as standalone crate: Still works but redundant -- Tauri v2 has the same functionality built in.

## Screen Capture Exclusion: Detailed Technical Analysis

### macOS Mechanism

Tauri's `content_protected(true)` calls `NSWindow.setSharingType(.none)` under the hood. This works through the following chain:

1. The NSWindow is marked with `sharingType = .none`
2. Legacy capture APIs (`CGWindowListCreateImage`, `CGDisplayStream`) respect this flag and exclude the window
3. **ScreenCaptureKit does NOT respect this flag** -- it captures the composited framebuffer directly

**Current app migration status (as of research date -- must be verified empirically):**
- **OBS:** Uses ScreenCaptureKit since OBS 27.x on macOS 12.3+. Likely captures content-protected windows on macOS 15+.
- **Zoom, Teams, Meet:** Migration status unclear. Apple is pushing all apps toward ScreenCaptureKit. The spike MUST test each one.
- **Notchie:** Claims to still work. Uses "macOS overlay layers that screen-sharing APIs ignore" per their marketing. This warrants investigation of what Notchie does differently.

**The critical distinction: "Share Screen" vs "Share Window":**
- When sharing the entire screen/display, ScreenCaptureKit captures the full display framebuffer. Content protection is ignored.
- When sharing a specific window, ScreenCaptureKit uses `SCContentFilter` with window-level filtering. It is plausible (but unverified) that window-level filtering respects `sharingType` or at least excludes certain windows from the selectable list.
- The spike should test both sharing modes for each app.

### Windows Mechanism

Tauri's `content_protected(true)` calls `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)`.

- `WDA_EXCLUDEFROMCAPTURE` (value `0x00000011`): Available since Windows 10 version 2004 (build 10.0.19041). Completely removes the window from all capture outputs.
- `WDA_MONITOR` (value `0x00000001`): Older flag. Shows a black rectangle where the window is, instead of the window content.
- **WebView2 conflict:** Was fixed by Microsoft in early 2021 (WebView2Feedback issue #841 closed as COMPLETED). Current WebView2 Runtime should not have this issue, but must be verified.
- **Transparency conflict:** `WDA_EXCLUDEFROMCAPTURE` may fail (return 0) when window transparency/AllowTransparency is enabled. This specific combination must be tested.
- **Windows 11 subset failure:** A documented subset of Windows 11 machines where both `WDA_EXCLUDEFROMCAPTURE` and `WDA_MONITOR` fail. No workaround exists.

### Recommended Testing Protocol for Phase 1

Build the overlay with `content_protected(true)` and test against this matrix:

| App | macOS 14 (Screen) | macOS 14 (Window) | macOS 15+ (Screen) | macOS 15+ (Window) | Windows 10 | Windows 11 |
|-----|-------------------|-------------------|---------------------|---------------------|------------|------------|
| Zoom | ? | ? | ? | ? | ? | ? |
| Teams | ? | ? | ? | ? | ? | ? |
| Meet | ? | ? | ? | ? | ? | ? |
| OBS | ? | ? | ? | ? | ? | ? |

Fill this matrix with "Hidden" or "Visible" during the spike. This becomes the project's compatibility statement.

## Glassmorphic Design: Effect Selection Guide

### macOS: Recommended Material

Use `Effect::HudWindow` for the overlay. HudWindow is specifically designed for heads-up display windows -- dark, translucent, high-contrast. It automatically adapts to light/dark appearance but maintains a dark aesthetic, which matches the "dark smoke tint" decision.

Alternatives if HudWindow is too opaque or too transparent:
- `Effect::Popover`: Lighter than HudWindow, used for popover panels (like macOS Control Center)
- `Effect::Menu`: Similar to popover, system menu appearance
- `Effect::UnderWindowBackground`: Behind-window blur, more subtle

Use `.state(EffectState::Active)` to ensure the effect stays active when the overlay loses focus (which it will, since users interact with other apps while presenting).

### Windows: Recommended Effect

Use `Effect::Acrylic` for Windows 10/11. Acrylic provides a noise texture + blur combination that approximates macOS vibrancy.

**Known performance issue:** Acrylic has poor resize/drag performance on Windows 10 v1903+ and Windows 11 build 22000. Since the Phase 1 overlay is not resizable and not draggable, this is acceptable.

Alternative: `Effect::Mica` (Windows 11 only) is more performant but more subtle. It samples the desktop wallpaper rather than blurring the actual content behind the window. For an always-on-top overlay, Acrylic gives a better frosted-glass feel.

### CSS Layering on Top of Native Vibrancy

The native vibrancy provides the frosted-glass background. CSS provides:
- Text color and styling: `text-white/95`, `font-medium`, `text-lg`
- Drop shadow for edge definition: `drop-shadow-sm` or custom shadow
- Inner padding and layout
- Semi-transparent overlays for additional darkening if needed: `bg-black/10`

```tsx
// Example overlay component
<div className="w-full h-full p-4 flex items-start justify-center">
  <p className="text-white/95 text-lg font-medium leading-relaxed
                text-center max-w-[90%] drop-shadow-sm">
    {sampleScript}
  </p>
</div>
```

## Platform-Specific Rust Code Organization

### Conditional Compilation Pattern

For Phase 1, platform-specific code is minimal (overlay creation is cross-platform via Tauri APIs). However, establishing the pattern now prepares for Phase 4/5 speech adapters.

```rust
// src-tauri/src/overlay.rs -- cross-platform via Tauri APIs
// No #[cfg] needed here -- Tauri abstracts the platform differences

// Future pattern for platform-specific code (Phase 4+):
// src-tauri/src/speech/mod.rs
// #[cfg(target_os = "macos")]
// mod macos;
// #[cfg(target_os = "windows")]
// mod windows;
```

### Cargo.toml Platform Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-global-shortcut = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Phase 1 does not need platform-specific dependencies.
# The overlay uses Tauri's built-in cross-platform APIs.
# Platform-specific crates (objc2, windows-rs) are deferred to
# later phases when direct native API access is needed for
# speech recognition (Phase 4) and VAD (Phase 5).
```

## Building and Testing Production Builds

### macOS

```bash
# Build production app bundle + DMG
cargo tauri build

# Output location
ls src-tauri/target/release/bundle/macos/  # .app bundle
ls src-tauri/target/release/bundle/dmg/    # .dmg installer

# Verify transparency is maintained in production build
open src-tauri/target/release/bundle/macos/Steadi.app

# Verify content protection is applied (if code signing is set up)
codesign -d --entitlements - src-tauri/target/release/bundle/macos/Steadi.app
```

### Windows

```bash
# Build production installer (MSI or NSIS)
cargo tauri build

# Output location
# src-tauri/target/release/bundle/msi/    # .msi installer
# src-tauri/target/release/bundle/nsis/   # .exe installer

# Note: MSI can only be built on Windows (requires WiX)
# NSIS can be built on Windows (and cross-compiled with limitations)
```

### Network Isolation Verification (PLAT-09)

```bash
# macOS: Monitor network activity during app use
nettop -p $(pgrep Steadi) -J bytes_in,bytes_out

# Alternative: Use Little Snitch or Lulu to verify zero network calls

# Windows: Use Resource Monitor > Network tab to verify no connections
```

## Open Questions

Things that could not be fully resolved through research and must be answered by the spike:

1. **Does Notchie use a technique beyond sharingType = .none?**
   - What we know: Notchie claims to work on macOS with all major conferencing apps. Their marketing says "macOS overlay layers that screen-sharing APIs ignore" at the "display level."
   - What's unclear: Whether this is just `sharingType = .none` (which they know still works for current app versions), or a genuinely different technique (specific window level, CGS private APIs, etc.).
   - Recommendation: Test Steadi's `content_protected(true)` first. If it fails on macOS 15+ for specific apps, investigate Notchie's actual approach by examining their binary or testing side-by-side.

2. **Does `WDA_EXCLUDEFROMCAPTURE` work with transparent WebView2 windows in 2026?**
   - What we know: The COMException bug was fixed in 2021. Separate reports say `WDA_EXCLUDEFROMCAPTURE` fails with `AllowTransparency`.
   - What's unclear: Whether Tauri's specific transparency implementation triggers the failure, and whether current WebView2 runtime versions have resolved all conflicts.
   - Recommendation: Test immediately on Windows. If it fails, test with `transparent(false)` to isolate the issue.

3. **Which conferencing apps on macOS 15+ still use legacy capture APIs?**
   - What we know: OBS uses ScreenCaptureKit since macOS 12.3. Apple deprecated `CGWindowListCreateImage` in macOS 14 and obsoleted it in macOS 15.
   - What's unclear: Current Zoom, Teams, and Meet macOS versions -- whether they have fully migrated to ScreenCaptureKit.
   - Recommendation: Empirical testing is the only reliable answer. Build the spike and test.

4. **Does Tauri's EffectsBuilder corner radius work for the overlay shape?**
   - What we know: `EffectsBuilder` accepts `.radius(10.0)` which controls the vibrancy effect corner radius.
   - What's unclear: Whether this produces visible rounded corners on the overlay window itself, or only rounds the vibrancy effect region while the window remains rectangular.
   - Recommendation: Test and adjust. May need CSS `border-radius` on the root element as a supplement, or `clip-path` for the window shape.

5. **How does the overlay behave on screens with a notch vs. without?**
   - What we know: Tauri provides `app.primary_monitor()` for screen dimensions and scaling.
   - What's unclear: Whether Tauri's position coordinates account for the notch area / menu bar height, and where (0, 0) places the window relative to the notch.
   - Recommendation: Test on both a notch MacBook and an external monitor. Adjust y-position based on findings.

## Sources

### Primary (HIGH confidence)
- [Tauri Window API (docs.rs)](https://docs.rs/tauri/latest/tauri/window/struct.Window.html) -- `set_content_protected`, `set_effects`, `set_always_on_top`, `set_ignore_cursor_events`
- [Tauri WebviewWindowBuilder (docs.rs)](https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html) -- `transparent`, `content_protected`, `effects`, `always_on_top`, `decorations`
- [Tauri Effect enum (docs.rs)](https://docs.rs/tauri/latest/tauri/window/enum.Effect.html) -- 27 variants with platform compatibility
- [Tauri Config Schema](https://schema.tauri.app/config/2) -- complete window configuration properties
- [Tauri Window Customization Guide](https://v2.tauri.app/learn/window-customization/) -- transparency, decorations, titlebar style
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/) -- registration, handler, capabilities
- [Tauri Capabilities for Windows/Platforms](https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/) -- per-window security model
- [Vite Multi-Page Build](https://vite.dev/guide/build) -- `rollupOptions.input` for multiple HTML entries
- [SetWindowDisplayAffinity (Microsoft)](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowdisplayaffinity) -- `WDA_EXCLUDEFROMCAPTURE` documentation
- [NSVisualEffectView.Material (Apple)](https://developer.apple.com/documentation/appkit/nsvisualeffectview/material) -- macOS vibrancy materials

### Secondary (MEDIUM confidence)
- [Tauri Issue #14200: macOS 15+ ScreenCaptureKit ignores sharingType](https://github.com/tauri-apps/tauri/issues/14200) -- confirmed upstream issue
- [Apple Developer Forums: macOS 15.4+ sharingType broken](https://developer.apple.com/forums/thread/792152) -- Apple acknowledgment
- [WebView2 + SetWindowDisplayAffinity Issue #841](https://github.com/MicrosoftEdge/WebView2Feedback/issues/841) -- COMException bug (fixed 2021)
- [Tauri Issue #13415: Transparent window loses transparency after DMG build](https://github.com/tauri-apps/tauri/issues/13415)
- [Electron Issue #48258: setContentProtection on macOS 15+](https://github.com/electron/electron/issues/48258) -- closed as NOT_PLANNED
- [Tauri Issue #10213: set_content_protected not working on Chrome screen share](https://github.com/tauri-apps/tauri/issues/10213)
- [How Interview Cheating Tools Hide from Zoom](https://adamsvoboda.net/how-interview-cheating-tools-hide-from-zoom/) -- technical analysis of screen-hide techniques
- [Tauri Creating Windows Tutorial](https://tauritutorials.com/blog/creating-windows-in-tauri) -- multi-window code examples
- [window-vibrancy GitHub](https://github.com/tauri-apps/window-vibrancy) -- standalone vibrancy crate (absorbed into Tauri v2)
- [WDA_EXCLUDEFROMCAPTURE transparency failure](https://github.com/microsoft/Windows.UI.Composition-Win32-Samples/issues/56) -- AllowTransparency conflict

### Tertiary (LOW confidence)
- [Notchie.app](https://www.notchie.app/) -- claims "macOS overlay layers that screen-sharing APIs ignore"; technique unverified
- [Building a (kind of) invisible mac app](https://pierce.dev/notes/building-a-kind-of-invisible-mac-app) -- NSWindow level and sharing type analysis
- [Dark Side of the Mac: Appearance & Materials](https://mackuba.eu/2018/07/04/dark-side-mac-1/) -- NSVisualEffectMaterial visual guide (2018, pre-macOS 15)

## Metadata

**Confidence breakdown:**
- Tauri API surface (window, effects, shortcuts): HIGH -- verified via docs.rs and official docs
- macOS 14 invisibility: HIGH -- `sharingType = .none` is well-documented and works with legacy capture APIs
- macOS 15+ invisibility: LOW -- Apple confirms no workaround for ScreenCaptureKit; Notchie's continued operation is unexplained
- Windows invisibility: MEDIUM -- `WDA_EXCLUDEFROMCAPTURE` documented and supported; WebView2 conflict was fixed but transparency conflict uncertain
- Glassmorphic vibrancy: HIGH -- `EffectsBuilder` API well-documented with 27 effect variants
- Multi-window architecture: HIGH -- `WebviewWindowBuilder` API well-documented with code examples
- Production build behavior: MEDIUM -- known issues documented but specific current-version behavior must be tested

**Research date:** 2026-02-15
**Valid until:** 7 days (fast-moving area -- macOS/Windows updates and conferencing app updates can change invisibility behavior at any time)
