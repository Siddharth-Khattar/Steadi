---
phase: 02-script-editor
plan: 01
subsystem: persistence
tags: [zustand, tauri-plugin-fs, tauri-plugin-store, typescript]

# Dependency graph
requires:
  - phase: 01-platform-validation
    provides: Tauri app scaffolding, multi-window build, lib.rs plugin registration pattern
provides:
  - Script, ScriptMeta, Folder, AppMetadata type definitions
  - Filesystem persistence layer for script content (read/write/delete .md files)
  - Tauri store-backed Zustand storage adapter for metadata persistence
  - useScriptStore with full CRUD for scripts and folders
  - useUIStore for sidebar and preview visibility preferences
affects: [02-02-editor-component, 02-03-sidebar-layout, 02-04-integration]

# Tech tracking
tech-stack:
  added: [zustand, "@uiw/react-codemirror", "@codemirror/lang-markdown", "@codemirror/theme-one-dark", react-markdown, remark-gfm, react-resizable-panels, "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities", "@tauri-apps/plugin-fs", "@tauri-apps/plugin-store"]
  patterns: [zustand-persist-with-tauri-storage, metadata-in-store-content-on-filesystem, partialize-for-selective-persistence]

key-files:
  created: [src/persistence/types.ts, src/persistence/scriptFiles.ts, src/persistence/tauriStorage.ts, src/stores/scriptStore.ts, src/stores/uiStore.ts]
  modified: [package.json, src-tauri/Cargo.toml, src-tauri/src/lib.rs, src-tauri/capabilities/main-window.json]

key-decisions:
  - "Tauri store plugin requires `defaults` field in StoreOptions; pass empty object with autoSave: true"
  - "Script content persisted as individual .md files on filesystem; metadata via Tauri store JSON"
  - "Zustand partialize used to exclude activeContent and isLoading from persistence"
  - "setActiveScript flushes pending content for previous script before switching"

patterns-established:
  - "Persistence split: metadata in Tauri store, content in Tauri filesystem"
  - "Custom Zustand StateStorage adapter wrapping Tauri store plugin singleton"
  - "Zustand persist with partialize for selective state persistence"

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 2 Plan 1: Foundation and Persistence Summary

**Zustand stores with Tauri-backed persistence: fs plugin for script .md files, store plugin for metadata/UI state via custom StateStorage adapter**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T00:37:24Z
- **Completed:** 2026-02-16T00:41:13Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Installed all Phase 2 npm dependencies (codemirror, react-markdown, resizable-panels, dnd-kit, zustand, tauri plugins)
- Registered tauri-plugin-fs and tauri-plugin-store in Rust with full filesystem permissions scoped to AppData
- Built complete persistence layer: typed domain models, filesystem ops for script content, Tauri store adapter for Zustand
- Created useScriptStore with full CRUD (create/rename/delete/reorder/move scripts and folders, active script management, content save/load)
- Created useUIStore for sidebar and preview visibility with cross-restart persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and register Tauri plugins** - `86791b9` (feat)
2. **Task 2: Create type definitions and persistence layer** - `b200ebd` (feat)
3. **Task 3: Create Zustand stores for script and UI state** - `9e3c367` (feat)

## Files Created/Modified
- `src/persistence/types.ts` - Script, ScriptMeta, Folder, AppMetadata type definitions
- `src/persistence/scriptFiles.ts` - Filesystem operations for script .md files in AppData/scripts/
- `src/persistence/tauriStorage.ts` - Custom Zustand StateStorage adapter backed by Tauri store plugin
- `src/stores/scriptStore.ts` - Zustand store for scripts/folders with Tauri-backed persistence
- `src/stores/uiStore.ts` - Zustand store for UI preferences (sidebar, preview visibility)
- `package.json` - Added 12 npm dependencies for Phase 2
- `src-tauri/Cargo.toml` - Added tauri-plugin-fs and tauri-plugin-store Rust crates
- `src-tauri/src/lib.rs` - Registered fs and store plugins in Builder chain
- `src-tauri/capabilities/main-window.json` - Added fs and store permissions with AppData scope

## Decisions Made
- **StoreOptions requires defaults field:** The installed version of @tauri-apps/plugin-store types make `defaults` mandatory within `StoreOptions`. Passed empty object `{}` with `autoSave: true` since Zustand manages the actual default values.
- **Flush on script switch:** `setActiveScript` saves the previous script's content before loading the new one, preventing data loss during rapid switching (addresses Pitfall 4 from research).
- **Partialize persistence:** Only `folders`, `scripts`, and `activeScriptId` are persisted. `activeContent` lives on the filesystem and `isLoading` is transient.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Tauri store plugin StoreOptions type mismatch**
- **Found during:** Task 2 (tauriStorage.ts creation)
- **Issue:** Research pattern used `{ autoSave: true }` but installed @tauri-apps/plugin-store v2.4.2 requires `defaults` as a mandatory field in StoreOptions
- **Fix:** Added `defaults: {}` to the options object alongside `autoSave: true`
- **Files modified:** src/persistence/tauriStorage.ts
- **Verification:** `npm run typecheck` passes
- **Committed in:** b200ebd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor API surface difference from research. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All types, persistence, and stores are ready for import by subsequent plans
- Plan 02-02 (editor component) can import `useScriptStore` and `useUIStore`
- Plan 02-03 (sidebar/layout) can import types and stores
- No blockers or concerns

---
*Phase: 02-script-editor*
*Completed: 2026-02-16*
