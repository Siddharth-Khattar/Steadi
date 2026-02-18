// ABOUTME: Tauri IPC command handlers for overlay and editor session management.
// ABOUTME: Bridges frontend invoke calls to Rust overlay and editor_fab functions.

use tauri::{AppHandle, Manager};

use crate::editor_fab;
use crate::overlay;

/// Toggles overlay visibility via IPC. Returns the new visibility state.
#[tauri::command]
pub fn toggle_overlay(app: AppHandle) -> Result<bool, String> {
    overlay::toggle_overlay(&app).map_err(|e| e.to_string())
}

/// Creates the overlay window via IPC.
#[tauri::command]
pub fn create_overlay(app: AppHandle) -> Result<(), String> {
    overlay::create_overlay(&app)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Starts a teleprompter session: shows the overlay, hides the main editor window, and shows the FAB.
///
/// Creates the FAB window if it doesn't already exist, then shows the overlay,
/// the FAB, and hides the main editor window so the session is fully visible.
#[tauri::command]
pub fn start_teleprompter_session(app: AppHandle) -> Result<(), String> {
    // Ensure FAB exists
    editor_fab::create_editor_fab(&app).map_err(|e| e.to_string())?;

    // Ensure the overlay is visible for the session
    if let Some(overlay) = app.webview_windows().get("overlay") {
        overlay.show().map_err(|e| e.to_string())?;
    }

    // Show the FAB
    if let Some(fab) = app.webview_windows().get("editor-fab") {
        fab.show().map_err(|e| e.to_string())?;
    }

    // Hide the main editor window
    if let Some(main_win) = app.webview_windows().get("main") {
        main_win.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Hides the overlay window.
///
/// Called from the overlay's Esc handler when the user has chosen to close
/// the overlay after stopping the teleprompter.
#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.webview_windows().get("overlay") {
        overlay.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Restores the main editor window and hides the FAB.
///
/// Called from the FAB button click or when the overlay Escape key is pressed.
#[tauri::command]
pub fn restore_editor(app: AppHandle) -> Result<(), String> {
    // Show and focus the main editor window
    if let Some(main_win) = app.webview_windows().get("main") {
        main_win.show().map_err(|e| e.to_string())?;
        main_win.set_focus().map_err(|e| e.to_string())?;
    }

    // Hide the FAB
    editor_fab::hide_fab(&app);

    Ok(())
}
