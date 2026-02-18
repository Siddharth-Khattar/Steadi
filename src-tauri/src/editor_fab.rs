// ABOUTME: Creates and manages the editor FAB (floating action button) window.
// ABOUTME: The FAB appears at the bottom-right of the screen when the teleprompter session is active.

use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, PhysicalPosition, WebviewUrl};

/// Logical size of the FAB window in points.
const FAB_SIZE: f64 = 56.0;

/// Margin from the work area edges in logical points.
const EDGE_MARGIN: f64 = 16.0;

/// Monitor geometry in physical pixels plus the scale factor, including
/// the work area (usable screen space excluding the taskbar / dock).
struct MonitorInfo {
    /// Work area origin X in physical pixels.
    work_x: f64,
    /// Work area origin Y in physical pixels.
    work_y: f64,
    /// Work area width in physical pixels.
    work_w: f64,
    /// Work area height in physical pixels.
    work_h: f64,
    /// Display scale factor (e.g. 2.0 for Retina / 150% DPI).
    scale: f64,
}

/// Returns the work area (usable space excluding taskbar/dock) and scale
/// factor for the monitor that currently contains the given window label.
/// Falls back to the primary monitor, then to a 1920×1080 default.
fn monitor_info_for_window(app: &AppHandle, label: &str) -> MonitorInfo {
    // Try the monitor the target window is currently on
    if let Some(win) = app.webview_windows().get(label) {
        if let Ok(Some(monitor)) = win.current_monitor() {
            let wa = monitor.work_area();
            return MonitorInfo {
                work_x: wa.position.x as f64,
                work_y: wa.position.y as f64,
                work_w: wa.size.width as f64,
                work_h: wa.size.height as f64,
                scale: monitor.scale_factor(),
            };
        }
    }

    // Fall back to primary monitor
    if let Ok(Some(monitor)) = app.primary_monitor() {
        let wa = monitor.work_area();
        return MonitorInfo {
            work_x: wa.position.x as f64,
            work_y: wa.position.y as f64,
            work_w: wa.size.width as f64,
            work_h: wa.size.height as f64,
            scale: monitor.scale_factor(),
        };
    }

    // Sensible fallback if all monitor detection fails
    MonitorInfo {
        work_x: 0.0,
        work_y: 0.0,
        work_w: 1920.0,
        work_h: 1080.0,
        scale: 1.0,
    }
}

/// Creates the editor FAB window at the bottom-right of the main editor's
/// current monitor's work area.
///
/// The window is:
/// - Transparent and frameless (the React component provides visuals)
/// - Always on top so it's accessible over other windows
/// - Content-protected to exclude from screen recordings
/// - Initially hidden — shown when a teleprompter session starts
///
/// Uses the monitor's **work area** (excluding the taskbar / dock) for
/// positioning so the FAB is never hidden behind system UI, regardless of
/// taskbar position, auto-hide state, or display scaling.
///
/// Position is set AFTER creation via `set_position(PhysicalPosition)` to
/// avoid a known cross-platform inconsistency: the builder's `position()`
/// passes logical coordinates that `tao` must convert back to physical at
/// creation time. On Windows the conversion can pick the wrong DPI scale
/// (especially with non-100% display scaling or multi-monitor setups),
/// pushing the window off-screen. Setting position as physical pixels on an
/// already-created window is unambiguous on every platform.
pub fn create_editor_fab(app: &AppHandle) -> tauri::Result<()> {
    // Skip if the FAB window already exists
    if app.webview_windows().contains_key("editor-fab") {
        return Ok(());
    }

    let mon = monitor_info_for_window(app, "main");

    // Convert logical constants to physical pixels for the target monitor.
    let fab_phys = (FAB_SIZE * mon.scale).round();
    let margin_phys = (EDGE_MARGIN * mon.scale).round();

    // Position at bottom-right of the work area (not full screen area),
    // which automatically avoids the macOS dock and Windows taskbar.
    let phys_x = mon.work_x + mon.work_w - fab_phys - margin_phys;
    let phys_y = mon.work_y + mon.work_h - fab_phys - margin_phys;

    // Build the window without position — it's created hidden so no flash.
    let fab = WebviewWindowBuilder::new(
        app,
        "editor-fab",
        WebviewUrl::App("editor-fab/index.html".into()),
    )
    .title("Steadi FAB")
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .shadow(false)
    .skip_taskbar(true)
    .resizable(false)
    .visible(false)
    .content_protected(true)
    .inner_size(FAB_SIZE, FAB_SIZE)
    .build()?;

    // Place the window using unambiguous physical coordinates.
    fab.set_position(PhysicalPosition::new(phys_x as i32, phys_y as i32))?;

    Ok(())
}

/// Hides the editor FAB window if it exists.
pub fn hide_fab(app: &AppHandle) {
    if let Some(fab) = app.webview_windows().get("editor-fab") {
        fab.hide().ok();
    }
}
