// ABOUTME: Tauri application entry point. Initializes plugins, registers
// ABOUTME: global shortcuts, and sets up Tauri command handlers.

mod commands;
mod overlay;

use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

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
