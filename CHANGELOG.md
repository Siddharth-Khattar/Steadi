# Changelog

All notable changes to Steadi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.0.4] - 2026-02-18

### Added

- **Invisible overlay**: always-on-top teleprompter excluded from screen capture via native OS APIs (`NSWindow.sharingType` on macOS, `SetWindowDisplayAffinity` on Windows)
- **Markdown-native editor**: distraction-free CodeMirror 6 editor with toggleable rendered preview panel
- **Auto-scroll with 3 speed presets**: Slow (30 px/s), Medium (52 px/s), Fast (82 px/s) using a frame-rate-independent scroll engine
- **Global hotkeys**: system-wide shortcuts for play/pause, speed cycling, rewind, scroll, and visibility toggle
- **Full customization**: resizable overlay with adjustable font size (12–64 px) and opacity (30–100%), all persisted across sessions
- **Multi-monitor support**: cycle the overlay between connected displays
- **File management**: folders and scripts with drag-and-drop reordering and cross-folder moves via `@dnd-kit`
- **3-2-1 countdown**: animated countdown before auto-scroll begins
- **Editor FAB**: floating restore button visible during teleprompter sessions
- **Progress bar**: visual scroll progress indicator on the overlay
- **Keyboard shortcut guide**: press `?` on the overlay to see all available shortcuts
- **Homebrew distribution**: `brew install --cask steadi` via the `siddharth-khattar/steadi` tap
- **Shell installer**: `curl`-based install script with quarantine stripping and architecture detection
- **CI/CD pipeline**: GitHub Actions workflows for CI checks, tag-triggered releases, and automated Homebrew tap updates
- **100% on-device**: zero network calls, zero telemetry, zero accounts

[0.0.4]: https://github.com/Siddharth-Khattar/Steadi/releases/tag/v0.0.4
