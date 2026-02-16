# Phase 3: Overlay and Auto-Scroll - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the invisible overlay into a fully functional teleprompter with rendered markdown, auto-scrolling, manual controls, persistent customization (position, size, font, opacity), and keyboard-first operation. Voice sync is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Overlay text display
- Balanced text display — not giant karaoke-style, not tiny document reader. Readable at a glance with enough context visible
- Markdown rendering: moderate depth — headers for section breaks, bold/italic for emphasis, bullet lists for key points. No code blocks or links
- Freely resizable overlay — user drags edges/corners to any size, persisted across restarts
- Soft white body text with subtle accent colors for headers/emphasis — visual hierarchy against the dark background
- Thin progress bar at the bottom edge, filling left to right as the script progresses
- Fade effect at top edge only — already-read text fades out, upcoming text at bottom is fully visible
- Subtle highlight on the current reading line — faint background highlight to guide the eye

### Countdown & launch flow
- 3-second countdown (3, 2, 1)
- Script text visible but dimmed during countdown, number overlays it, then script brightens and scrolling auto-starts
- Scrolling begins automatically after countdown — no keypress needed
- Editor window minimizes to dock when teleprompter launches

### Control scheme
- Left-hand keyboard layout — shortcuts clustered on the left side of the keyboard
- Play/pause: space when overlay focused, plus a global hotkey that works from any app
- Speed adjustment: 3 presets (slow, medium, fast) cycled with a single key, brief indicator when changed
- Global hotkey for toggle overlay visibility (already exists from Phase 1)

### Scroll & rewind feel
- Smooth continuous scroll — constant upward motion like a film credit roll
- Rewind (step back one sentence): smooth animated scroll back to previous sentence
- Click-to-toggle: clicking overlay content toggles play/pause (replaced hover-to-pause — hover conflicts with click interactions)
- End of script: scrolling stops silently at the last line, no extra messaging or auto-close

### Claude's Discretion
- Exact keyboard shortcut bindings (within the left-hand constraint)
- Font size range and default
- Opacity range and default
- Speed preset values (px/sec for slow, medium, fast)
- Progress bar styling (color, thickness)
- Current-line highlight styling
- Fade gradient length at top edge
- Animation timing for rewind scroll-back
- How the countdown number is styled/animated
- Default overlay position and size on first launch

</decisions>

<specifics>
## Specific Ideas

- User wants the teleprompter to feel balanced — not a karaoke screen, not a document reader
- Countdown should feel like a video recording countdown — script visible underneath, dimmed, with the number overlaying
- Editor minimizing to dock is important — clean screen while presenting
- Left-hand-only keyboard operation while presenting (right hand may be gesturing or on mouse)
- Speed cycling through presets rather than granular adjustment — keep it simple mid-presentation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-overlay-and-auto-scroll*
*Context gathered: 2026-02-16*
