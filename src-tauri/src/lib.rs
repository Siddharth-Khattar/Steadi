// ABOUTME: Tauri application entry point. Initializes plugins, registers
// ABOUTME: global shortcuts, and sets up Tauri command handlers.

mod commands;
mod overlay;

use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Cmd+Shift+S on macOS, Ctrl+Shift+S on Windows/Linux.
fn toggle_shortcut() -> Shortcut {
    #[cfg(target_os = "macos")]
    let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;

    Shortcut::new(Some(modifiers), Code::KeyS)
}

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
            if let Err(e) = app.global_shortcut().register(toggle_shortcut()) {
                eprintln!("Failed to register global shortcut: {e}");
            }

            if let Err(e) = overlay::create_overlay(app.handle()) {
                eprintln!("Failed to create overlay on startup: {e}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
