// ABOUTME: Binary entry point for the Steadi Tauri application.
// ABOUTME: Delegates to the library crate's run() function.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    steadi_lib::run()
}
