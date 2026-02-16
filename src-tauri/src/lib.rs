// ABOUTME: Tauri application entry point. Initializes plugins, registers
// ABOUTME: global shortcuts, and sets up Tauri command handlers.

mod commands;
mod editor_fab;
mod overlay;

use tauri::Emitter;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Platform-aware modifier: Cmd on macOS, Ctrl on Windows/Linux.
fn platform_modifiers() -> Modifiers {
    #[cfg(target_os = "macos")]
    let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;

    modifiers
}

/// Cmd+Shift+F — Toggle overlay visibility.
fn toggle_overlay_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::KeyF)
}

/// Cmd+Shift+Space — Play/pause teleprompter scrolling.
fn toggle_play_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::Space)
}

/// Cmd+Shift+S — Cycle speed preset (slow -> medium -> fast -> slow).
fn cycle_speed_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::KeyS)
}

/// Cmd+Shift+R — Rewind one sentence.
fn rewind_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::KeyR)
}

/// Cmd+Shift+W — Manual scroll up.
fn scroll_up_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::KeyW)
}

/// Cmd+Shift+X — Manual scroll down (X is left-hand accessible, below W).
fn scroll_down_shortcut() -> Shortcut {
    Shortcut::new(Some(platform_modifiers()), Code::KeyX)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    if *shortcut == toggle_overlay_shortcut() {
                        overlay::toggle_overlay(app).ok();
                    } else if *shortcut == toggle_play_shortcut() {
                        app.emit_to("overlay", "teleprompter:toggle-play", ()).ok();
                    } else if *shortcut == cycle_speed_shortcut() {
                        app.emit_to("overlay", "teleprompter:cycle-speed", ()).ok();
                    } else if *shortcut == rewind_shortcut() {
                        app.emit_to("overlay", "teleprompter:rewind", ()).ok();
                    } else if *shortcut == scroll_up_shortcut() {
                        app.emit_to("overlay", "teleprompter:scroll-up", ()).ok();
                    } else if *shortcut == scroll_down_shortcut() {
                        app.emit_to("overlay", "teleprompter:scroll-down", ()).ok();
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::toggle_overlay,
            commands::create_overlay,
            commands::start_teleprompter_session,
            commands::restore_editor,
        ])
        .setup(|app| {
            // Register all global shortcuts individually
            if let Err(e) = app.global_shortcut().register(toggle_overlay_shortcut()) {
                eprintln!("Failed to register toggle overlay shortcut: {e}");
            }
            app.global_shortcut().register(toggle_play_shortcut()).ok();
            app.global_shortcut().register(cycle_speed_shortcut()).ok();
            app.global_shortcut().register(rewind_shortcut()).ok();
            app.global_shortcut().register(scroll_up_shortcut()).ok();
            app.global_shortcut().register(scroll_down_shortcut()).ok();

            if let Err(e) = overlay::create_overlay(app.handle()) {
                eprintln!("Failed to create overlay on startup: {e}");
            }

            if let Err(e) = editor_fab::create_editor_fab(app.handle()) {
                eprintln!("Failed to create editor FAB on startup: {e}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
