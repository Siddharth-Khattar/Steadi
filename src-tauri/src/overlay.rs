// ABOUTME: Creates and manages the invisible overlay window with platform-specific
// ABOUTME: screen capture exclusion. Dark notch-blending design, no vibrancy effects.

use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow};

/// Creates the overlay window with screen capture exclusion.
///
/// The overlay is:
/// - Transparent window with solid dark background via CSS (blends with MacBook notch)
/// - Always on top of other windows
/// - Protected from screen capture (content_protected)
/// - Positioned at top-center of screen, flush with top edge
/// - Bottom-only rounded corners via CSS (top flush with screen edge)
pub fn create_overlay(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let monitor = app
        .primary_monitor()?
        .expect("No primary monitor found");

    let scale = monitor.scale_factor();
    let screen_width = monitor.size().width as f64 / scale;
    let overlay_width = screen_width * 0.55;
    let overlay_height = 200.0;
    let x = (screen_width - overlay_width) / 2.0;
    let y = 0.0;

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
