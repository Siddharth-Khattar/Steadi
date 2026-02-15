# Phase 1: Platform Validation Spike - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove overlay invisibility works on macOS (14 and 15+) and Windows before any feature investment. Establish the Tauri multi-window app shell and glassmorphic design primitives that carry through all subsequent phases. No scrolling, no editor, no voice — just an invisible frosted-glass overlay with static demo content and a toggle shortcut.

</domain>

<decisions>
## Implementation Decisions

### Glassmorphic appearance
- Medium frost intensity — background shapes visible but details lost (like Apple's Control Center panels)
- Dark smoke tint — dark gray/charcoal glass for high text contrast and focused aesthetic
- Soft diffuse drop shadow to define edges — no visible border lines
- Light/white text on dark frosted glass for readability
- Visual reference: macOS Control Center — native, clean, system-level feel

### Overlay shape & positioning
- Compact panel form factor — ~50-60% screen width, 4-6 lines of text visible
- Positioned top-center, hugging the notch area (reference: Notchie app screenshot)
- Moderately rounded corners (8-12px radius, like macOS window corners)
- On MacBooks with notch: anchored around the notch/camera area
- On non-notch screens: sits at the top-center, just below menu bar

### Text alignment
- Support both center-aligned and left-aligned text
- Default is center-aligned
- User can switch between them (alignment toggle — full implementation in Phase 3, but design primitive established here)

### Spike demo content
- Sample teleprompter script (realistic 2-3 paragraph script mimicking actual use)
- Static display only — no scrolling (scrolling is Phase 3)
- Plain styled text — no markdown rendering yet (OVRL-07 is Phase 3)
- One keyboard shortcut to toggle overlay visibility — useful for screen share testing

### Claude's Discretion
- Exact blur radius and shadow spread values
- Specific font choice and size for demo text
- Sample script content
- Toggle shortcut key binding choice
- How the overlay handles different screen resolutions and scaling

</decisions>

<specifics>
## Specific Ideas

- "Like macOS Control Center" — the glassmorphic treatment should feel native and system-level, not custom or flashy
- Notchie app as positioning reference — overlay sits at top-center hugging the notch/camera area (screenshot provided)
- Dark smoke glass ensures readability since this is a teleprompter — text clarity is paramount
- The spike should feel like a glimpse of the real product, not a tech demo

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-platform-validation-spike*
*Context gathered: 2026-02-15*
