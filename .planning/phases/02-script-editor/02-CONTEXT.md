# Phase 2: Script Editor - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Notes-app-style markdown editor for writing and organizing teleprompter scripts. Includes a left sidebar file tree, plain-text markdown editor, toggleable rendered preview panel, local persistence, and top-right controls for launching the teleprompter and accessing settings. Creating/managing the teleprompter overlay behavior is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### File tree & organization
- Single-level folders — folders containing scripts, no nested folders (Apple Notes style)
- Toolbar "+" buttons at sidebar top for quick creation + right-click context menu for full operations (rename, delete, move)
- Full drag-and-drop reordering — drag scripts between folders and reorder within folders
- Each script entry shows title + 1-2 line content preview snippet (Apple Notes style)

### Editor experience
- Plain text markdown editing — raw markdown source visible (# and ** shown as typed)
- No formatting toolbar — distraction-free, just the text area (iA Writer style)
- Auto-save with debounce — saves automatically after typing pause (~1 second)
- Sans-serif font for the editor (e.g. Inter or SF Pro) — notes-app feel over code-editor feel

### Preview panel
- Toggle on/off — button or shortcut shows/hides the preview panel; when hidden, editor takes full width
- Debounced live updates — preview reflects edits after brief pause (~300ms)
- Standard markdown render — reading-friendly rendered output, not teleprompter simulation (that comes in Phase 3)
- Independent scroll — editor and preview scroll independently, no sync

### Visual design & layout
- Dark only — dark background throughout, consistent with the teleprompter overlay aesthetic
- Collapsible sidebar — can be collapsed/expanded via toggle or drag; when collapsed, editor takes full width
- Full glassmorphic styling — transparent/frosted panels throughout sidebar, editor background, and preview
- Labeled buttons for top-right controls — "Start Teleprompter", "Settings" with text labels

### Claude's Discretion
- Exact sidebar width and collapse animation
- Divider styling between editor and preview
- Editor line spacing and font size
- Preview panel typography and heading styles
- Keyboard shortcuts for toggle actions (preview, sidebar)
- Empty state design for new/blank scripts

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-script-editor*
*Context gathered: 2026-02-16*
