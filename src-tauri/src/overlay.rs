// ABOUTME: Creates and manages the invisible glassmorphic overlay window with
// ABOUTME: platform-specific screen capture exclusion and vibrancy effects.

use tauri::webview::WebviewWindowBuilder;
use tauri::window::{Color, Effect, EffectState, EffectsBuilder};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow};

/// Creates the overlay window with invisibility and vibrancy settings.
///
/// The overlay is:
/// - Transparent with native vibrancy (frosted glass via OS compositor)
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
        .effect(Effect::HudWindow) // macOS: dark translucent HUD material
        .effect(Effect::Acrylic) // Windows: acrylic blur effect
        .state(EffectState::Active) // Stay active even when unfocused
        .radius(10.0) // Rounded corners
        .color(Color(0, 0, 0, 200)) // Dark smoke tint
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
///
/// If the overlay window does not exist yet, creates it and returns true.
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
        create_overlay(app)?;
        Ok(true)
    }
}
