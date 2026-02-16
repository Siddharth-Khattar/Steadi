// ABOUTME: Creates and manages the editor FAB (floating action button) window.
// ABOUTME: The FAB appears at the bottom-right of the screen when the teleprompter session is active.

use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, WebviewUrl};

/// Logical size of the FAB window in points.
const FAB_SIZE: f64 = 56.0;

/// Margin from screen edges in logical points.
const EDGE_MARGIN: f64 = 16.0;

/// Extra clearance from the bottom to avoid the macOS dock / Windows taskbar.
const DOCK_CLEARANCE: f64 = 64.0;

/// Returns the monitor's position and size in logical pixels for the given
/// window label. Falls back to the primary monitor, then to a 1920x1080 default.
fn monitor_logical_for_window(app: &AppHandle, label: &str) -> (f64, f64, f64, f64) {
    // Try the monitor the target window is on
    if let Some(win) = app.webview_windows().get(label) {
        if let Ok(Some(monitor)) = win.current_monitor() {
            let scale = monitor.scale_factor();
            let x = monitor.position().x as f64 / scale;
            let y = monitor.position().y as f64 / scale;
            let w = monitor.size().width as f64 / scale;
            let h = monitor.size().height as f64 / scale;
            return (x, y, w, h);
        }
    }

    // Fall back to primary monitor
    if let Ok(Some(monitor)) = app.primary_monitor() {
        let scale = monitor.scale_factor();
        let x = monitor.position().x as f64 / scale;
        let y = monitor.position().y as f64 / scale;
        let w = monitor.size().width as f64 / scale;
        let h = monitor.size().height as f64 / scale;
        return (x, y, w, h);
    }

    // Sensible fallback if all monitor detection fails
    (0.0, 0.0, 1920.0, 1080.0)
}

/// Creates the editor FAB window at the bottom-right of the main editor's
/// current monitor.
///
/// The window is:
/// - Transparent and frameless (the React component provides visuals)
/// - Always on top so it's accessible over other windows
/// - Content-protected to exclude from screen recordings
/// - Initially hidden — shown when a teleprompter session starts
pub fn create_editor_fab(app: &AppHandle) -> tauri::Result<()> {
    // Skip if the FAB window already exists
    if app.webview_windows().contains_key("editor-fab") {
        return Ok(());
    }

    let (mon_x, mon_y, mon_w, mon_h) = monitor_logical_for_window(app, "main");

    let x = mon_x + mon_w - FAB_SIZE - EDGE_MARGIN;
    let y = mon_y + mon_h - FAB_SIZE - EDGE_MARGIN - DOCK_CLEARANCE;

    WebviewWindowBuilder::new(
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
    .position(x, y)
    .build()?;

    Ok(())
}

/// Hides the editor FAB window if it exists.
pub fn hide_fab(app: &AppHandle) {
    if let Some(fab) = app.webview_windows().get("editor-fab") {
        fab.hide().ok();
    }
}
