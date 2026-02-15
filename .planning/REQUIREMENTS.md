# Requirements: Steadi

**Defined:** 2026-02-15
**Core Value:** The teleprompter overlay must be completely invisible during screen sharing while scrolling in sync with the user's voice

## v1 Requirements

### Platform Validation

- [ ] **PLAT-01**: Overlay window is invisible to Zoom screen sharing on macOS
- [ ] **PLAT-02**: Overlay window is invisible to Teams screen sharing on macOS
- [ ] **PLAT-03**: Overlay window is invisible to Meet screen sharing on macOS
- [ ] **PLAT-04**: Overlay window is invisible to OBS on macOS
- [ ] **PLAT-05**: Overlay window is invisible to Zoom screen sharing on Windows
- [ ] **PLAT-06**: Overlay window is invisible to Teams screen sharing on Windows
- [ ] **PLAT-07**: Overlay window is invisible to Meet screen sharing on Windows
- [ ] **PLAT-08**: Overlay window is invisible to OBS on Windows
- [ ] **PLAT-09**: All speech processing runs on-device with zero network calls

### Overlay

- [ ] **OVRL-01**: Overlay displays as always-on-top transparent window near top-center of screen (notch-style default)
- [ ] **OVRL-02**: User can drag overlay to any screen position
- [ ] **OVRL-03**: Overlay position persists across app restarts
- [ ] **OVRL-04**: User can resize the overlay window
- [ ] **OVRL-05**: User can adjust font size in the overlay
- [ ] **OVRL-06**: User can adjust overlay opacity/transparency
- [ ] **OVRL-07**: Overlay renders markdown (bold, headers, emphasis)
- [ ] **OVRL-08**: Countdown timer (3-5 seconds) displays before scrolling begins

### Scrolling

- [ ] **SCRL-01**: macOS: text scrolls based on voice with word-level script tracking via SFSpeechRecognizer
- [ ] **SCRL-02**: macOS: current position in script is auto-highlighted
- [ ] **SCRL-03**: Windows: text scrolls based on voice cadence via Silero VAD — speeds up when talking, pauses on silence
- [ ] **SCRL-04**: Auto-scroll fallback mode with adjustable fixed speed
- [ ] **SCRL-05**: Rewind-to-sentence hotkey — each press steps back one sentence

### Editor

- [ ] **EDIT-01**: Raw markdown text editor for writing/editing scripts
- [ ] **EDIT-02**: Toggleable right-side rendered markdown preview (default 50% width, resizable)
- [ ] **EDIT-03**: Left sidebar file/folder tree for script organization
- [ ] **EDIT-04**: User can create new scripts and folders
- [ ] **EDIT-05**: User can delete scripts and folders
- [ ] **EDIT-06**: Scripts persist locally across app restarts

### Controls

- [ ] **CTRL-01**: Keyboard shortcut for play/pause scrolling
- [ ] **CTRL-02**: Keyboard shortcut for scroll speed adjustment (faster/slower)
- [ ] **CTRL-03**: Keyboard shortcut for manual scroll up/down
- [ ] **CTRL-04**: Keyboard shortcut to toggle overlay visibility
- [ ] **CTRL-05**: Hover-to-pause — mouse over overlay freezes scrolling instantly

### Design

- [ ] **DSGN-01**: Glassmorphic design language throughout — frosted glass backgrounds, translucency, soft borders
- [ ] **DSGN-02**: Native vibrancy APIs for glassmorphism (NSVisualEffectView on macOS, Mica/Acrylic on Windows)
- [ ] **DSGN-03**: Top-right controls in editor to launch teleprompter and access settings
- [ ] **DSGN-04**: Teleprompter starts for the currently opened file when "start" is clicked

## v2 Requirements

### Appearance

- **APPR-01**: Light and dark mode toggle (both maintaining glassmorphic aesthetic)
- **APPR-02**: Overlay background color customization
- **APPR-03**: Reading area margin adjustment for wide overlays

### Enhanced Controls

- **ECTL-01**: Adjustable microphone sensitivity
- **ECTL-02**: Reading guide/highlight line for position tracking
- **ECTL-03**: Elapsed time / remaining time display
- **ECTL-04**: Cue markers / bookmarks in scripts for section jumping

### File Management

- **FILE-01**: Import scripts from .md and .txt files
- **FILE-02**: Presentation remote / foot pedal support (HID keyboard)

### Internationalization

- **I18N-01**: Multi-language voice sync on macOS (expose SFSpeechRecognizer language picker)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Linux support | macOS and Windows only for v1; Tauri supports it if demand warrants |
| Cloud sync or accounts | Contradicts core privacy promise; users can use iCloud/OneDrive for folder sync |
| AI script generation | Scope explosion; users write in their own tools and paste into Steadi |
| Video recording | Massive complexity; conflicts with invisible overlay value prop |
| Multi-user collaboration | Orthogonal to single-user desktop focus |
| Remote control from second device | Requires networking/pairing; keyboard shortcuts cover the use case |
| Mirror/flip mode for beam splitters | Steadi targets screen overlay, not hardware teleprompter rigs |
| AI eye contact correction | Requires ML video processing; outside scope as a live overlay tool |
| Word/PDF/RTF import | File parsing adds bundle size; copy-paste is trivial |
| Multi-language voice (Windows) | Windows cadence scrolling is already language-agnostic; word-level deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete (human verified: Zoom macOS) |
| PLAT-02 | Phase 1 | Deferred (Teams not tested — not installed) |
| PLAT-03 | Phase 1 | Complete (human verified: Meet macOS) |
| PLAT-04 | Phase 1 | Deferred (OBS not tested — not installed) |
| PLAT-05 | Phase 1 | Deferred (no Windows machine) |
| PLAT-06 | Phase 1 | Deferred (no Windows machine) |
| PLAT-07 | Phase 1 | Deferred (no Windows machine) |
| PLAT-08 | Phase 1 | Deferred (no Windows machine) |
| PLAT-09 | Phase 1 | Complete (zero network calls verified) |
| OVRL-01 | Phase 1 | Complete (top-center, solid dark, bottom-rounded corners) |
| OVRL-02 | Phase 3 | Pending |
| OVRL-03 | Phase 3 | Pending |
| OVRL-04 | Phase 3 | Pending |
| OVRL-05 | Phase 3 | Pending |
| OVRL-06 | Phase 3 | Pending |
| OVRL-07 | Phase 3 | Pending |
| OVRL-08 | Phase 3 | Pending |
| SCRL-01 | Phase 4 | Pending |
| SCRL-02 | Phase 4 | Pending |
| SCRL-03 | Phase 5 | Pending |
| SCRL-04 | Phase 3 | Pending |
| SCRL-05 | Phase 3 | Pending |
| EDIT-01 | Phase 2 | Pending |
| EDIT-02 | Phase 2 | Pending |
| EDIT-03 | Phase 2 | Pending |
| EDIT-04 | Phase 2 | Pending |
| EDIT-05 | Phase 2 | Pending |
| EDIT-06 | Phase 2 | Pending |
| CTRL-01 | Phase 3 | Pending |
| CTRL-02 | Phase 3 | Pending |
| CTRL-03 | Phase 3 | Pending |
| CTRL-04 | Phase 3 | Pending |
| CTRL-05 | Phase 3 | Pending |
| DSGN-01 | Phase 1 | Revised (dark opaque design instead of glassmorphic — user decision) |
| DSGN-02 | Phase 1 | Revised (native CALayer API instead of vibrancy — vibrancy was too translucent) |
| DSGN-03 | Phase 2 | Pending |
| DSGN-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after Phase 1 completion*
