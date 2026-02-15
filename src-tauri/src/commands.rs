// ABOUTME: Tauri IPC command handlers for overlay window management.
// ABOUTME: Bridges frontend invoke calls to Rust overlay functions.

use tauri::AppHandle;

use crate::overlay;

/// Toggles overlay visibility via IPC. Returns the new visibility state.
#[tauri::command]
pub fn toggle_overlay(app: AppHandle) -> Result<bool, String> {
    overlay::toggle_overlay(&app).map_err(|e| e.to_string())
}

/// Creates the overlay window via IPC.
#[tauri::command]
pub fn create_overlay(app: AppHandle) -> Result<(), String> {
    overlay::create_overlay(&app).map(|_| ()).map_err(|e| e.to_string())
}
