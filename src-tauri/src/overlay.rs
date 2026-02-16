// ABOUTME: Creates and manages the invisible overlay window with screen capture exclusion.
// ABOUTME: Uses native macOS APIs for solid black background with bottom-only rounded corners.

use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow};

/// Creates the overlay window with screen capture exclusion and platform-specific styling.
///
/// The overlay is:
/// - Solid black with bottom-only rounded corners (via native CALayer on macOS)
/// - Always on top of other windows
/// - Protected from screen capture (content_protected)
/// - Positioned at top-center of screen below menu bar
pub fn create_overlay(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let monitor = app
        .primary_monitor()?
        .ok_or_else(|| tauri::Error::Anyhow(anyhow::anyhow!("No primary monitor found")))?;

    let scale = monitor.scale_factor();
    let screen_width = monitor.size().width as f64 / scale;
    let overlay_width = screen_width * 0.4;
    let overlay_height = 140.0;
    let x = (screen_width - overlay_width) / 2.0;
    let y = 0.0;

    let overlay =
        WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("overlay/index.html".into()))
            .title("Steadi Overlay")
            .transparent(true)
            .decorations(false)
            .always_on_top(true)
            .shadow(false)
            .skip_taskbar(true)
            .resizable(true)
            .visible(true)
            .content_protected(true)
            .inner_size(overlay_width, overlay_height)
            .position(x, y)
            .build()?;

    #[cfg(target_os = "macos")]
    apply_bottom_rounded_corners(&overlay);

    Ok(overlay)
}

/// On macOS, set the window's content view layer to have bottom-only rounded corners.
///
/// This bypasses Tauri's cross-platform effects API (which forces vibrancy/frosted glass)
/// and directly configures the native CALayer for a solid appearance with selective rounding.
#[cfg(target_os = "macos")]
fn apply_bottom_rounded_corners(overlay: &WebviewWindow) {
    let _ = overlay.with_webview(|webview| {
        use objc2_app_kit::NSWindow;
        use objc2_quartz_core::CACornerMask;

        unsafe {
            let ns_window_ptr = webview.ns_window();
            let ns_window: &NSWindow = &*(ns_window_ptr as *const NSWindow);

            // Make window non-opaque so corner transparency works
            ns_window.setOpaque(false);

            // Set window background to clear (corners will be transparent)
            let clear_color = objc2_app_kit::NSColor::clearColor();
            ns_window.setBackgroundColor(Some(&clear_color));

            // Configure content view layer for bottom-only rounded corners
            if let Some(content_view) = ns_window.contentView() {
                content_view.setWantsLayer(true);
                if let Some(layer) = content_view.layer() {
                    layer.setCornerRadius(16.0);
                    // CALayer coords: MinY = bottom of layer on screen
                    let bottom_corners =
                        CACornerMask::LayerMinXMinYCorner | CACornerMask::LayerMaxXMinYCorner;
                    layer.setMaskedCorners(bottom_corners);
                    layer.setMasksToBounds(true);
                }
            }
        }
    });
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
