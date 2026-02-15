// ABOUTME: Tauri application entry point. Initializes plugins, registers
// ABOUTME: global shortcuts, and sets up Tauri command handlers.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
