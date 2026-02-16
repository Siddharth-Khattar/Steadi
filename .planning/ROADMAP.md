# Roadmap: Steadi

## Overview

Steadi delivers a cross-platform invisible teleprompter in five phases, front-loading the highest-risk work (overlay invisibility on macOS 15+ and Windows) as a validation spike before investing in features. From there, the editor provides the content pipeline, the overlay becomes a fully controllable auto-scrolling teleprompter, and voice-synced scrolling is layered on per-platform (macOS word-level tracking first, then Windows cadence-based). Each phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Platform Validation Spike** - Prove overlay invisibility works on macOS and Windows; establish Tauri multi-window app with dark overlay design
- [x] **Phase 2: Script Editor** - Notes-app-style markdown editor with file tree and local persistence
- [ ] **Phase 3: Overlay and Auto-Scroll** - Fully functional teleprompter overlay with controls, auto-scroll, and markdown rendering
- [ ] **Phase 4: Voice Sync (macOS)** - Word-level speech tracking via SFSpeechRecognizer with auto-highlighting
- [ ] **Phase 5: Voice Sync (Windows)** - Cadence-based scrolling via Silero VAD with ONNX Runtime

## Phase Details

### Phase 1: Platform Validation Spike
**Goal**: The invisible overlay -- Steadi's core value proposition -- is proven to work on both macOS and Windows before any feature investment
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, PLAT-06, PLAT-07, PLAT-08, PLAT-09, OVRL-01, DSGN-01, DSGN-02
**Success Criteria** (what must be TRUE):
  1. A transparent always-on-top overlay window is visible on the desktop but does not appear in Zoom, Teams, Meet, or OBS screen shares on macOS (14 and 15+)
  2. A transparent always-on-top overlay window is visible on the desktop but does not appear in Zoom, Teams, Meet, or OBS screen shares on Windows
  3. The overlay renders near top-center of screen (notch-style positioning) with glassmorphic frosted-glass appearance using native vibrancy APIs
  4. Production-bundled builds (not dev mode) maintain overlay invisibility and transparency on both platforms
  5. No network calls are made by the application at any point (verified via network monitor)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Tauri 2 project and implement Rust overlay backend with screen capture exclusion and global shortcut
- [x] 01-02-PLAN.md — Build frontend UI for overlay teleprompter display and main window with glassmorphic design primitives
- [x] 01-03-PLAN.md — Production build verification and screen share invisibility testing across apps

### Phase 2: Script Editor
**Goal**: Users can write, organize, and manage teleprompter scripts in a polished notes-app-style editor
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, DSGN-03
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete scripts and folders in a left sidebar file tree
  2. User can write raw markdown in the editor and toggle a rendered preview panel on the right side (default 50% width, resizable divider)
  3. Scripts persist locally -- closing and reopening the app shows the same scripts and folder structure
  4. Top-right area of the editor contains controls for launching the teleprompter and accessing settings
  5. The editor, sidebar, and all panels use glassmorphic design language consistent with Phase 1 design primitives
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Install dependencies, register Tauri plugins, build persistence layer and Zustand stores
- [x] 02-02-PLAN.md — Create CodeMirror markdown editor with custom dark theme and auto-save
- [x] 02-03-PLAN.md — Build sidebar file tree with folders, scripts, CRUD, and drag-and-drop
- [x] 02-04-PLAN.md — Assemble three-panel layout with preview, top bar, and end-to-end verification

### Phase 3: Overlay and Auto-Scroll
**Goal**: The overlay is a fully functional teleprompter with manual controls, auto-scroll, and markdown rendering that users can operate entirely via keyboard
**Depends on**: Phase 2
**Requirements**: OVRL-02, OVRL-03, OVRL-04, OVRL-05, OVRL-06, OVRL-07, OVRL-08, SCRL-04, SCRL-05, CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05, DSGN-04
**Success Criteria** (what must be TRUE):
  1. Clicking "start" in the editor opens the overlay displaying the currently opened script with rendered markdown (bold, headers, emphasis), preceded by a countdown timer
  2. User can play/pause scrolling, adjust scroll speed, and manually scroll up/down using keyboard shortcuts
  3. User can drag the overlay to any position, resize it, adjust font size and opacity -- and all these settings persist across restarts
  4. Hovering the mouse over the overlay instantly freezes scrolling; moving away resumes it
  5. User can press a rewind hotkey to step back one sentence at a time in the script
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Teleprompter store, Tauri event capabilities, and Rust global shortcuts
- [ ] 03-02-PLAN.md — Overlay teleprompter UI with markdown rendering, countdown, scroll engine, and visual polish
- [ ] 03-03-PLAN.md — Start button wiring, overlay drag/resize, and geometry persistence
- [ ] 03-04-PLAN.md — Keyboard controls, hover-to-pause, rewind, and end-to-end verification

### Phase 4: Voice Sync (macOS)
**Goal**: On macOS, the teleprompter scrolls in sync with the user's voice at word-level precision, with the current position highlighted in the script
**Depends on**: Phase 3
**Requirements**: SCRL-01, SCRL-02
**Success Criteria** (what must be TRUE):
  1. On macOS, reading a script aloud causes the overlay to scroll to match the user's spoken position, with the current word or phrase visibly highlighted
  2. Pausing speech causes scrolling to pause; resuming speech resumes scrolling from the correct position
  3. The SpeechScrollAdapter trait is defined and the macOS implementation works through it, establishing the contract for Windows
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Voice Sync (Windows)
**Goal**: On Windows, the teleprompter scrolls based on voice cadence -- speeding up when the user is talking and pausing on silence
**Depends on**: Phase 4 (adapter trait defined in Phase 4)
**Requirements**: SCRL-03
**Success Criteria** (what must be TRUE):
  1. On Windows, reading a script aloud causes the overlay to scroll at a speed proportional to speech cadence, pausing during silence
  2. The Silero VAD model is bundled correctly and runs via ONNX Runtime without DLL conflicts on clean Windows machines
  3. Voice sync works seamlessly alongside all overlay controls from Phase 3 (hotkeys, hover-to-pause, rewind)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Validation Spike | 3/3 | Complete (macOS validated, Windows deferred) | 2026-02-15 |
| 2. Script Editor | 4/4 | Complete | 2026-02-16 |
| 3. Overlay and Auto-Scroll | 0/4 | Not started | - |
| 4. Voice Sync (macOS) | 0/2 | Not started | - |
| 5. Voice Sync (Windows) | 0/2 | Not started | - |
