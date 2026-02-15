# Feature Research

**Domain:** Cross-platform invisible teleprompter desktop application
**Researched:** 2026-02-15
**Confidence:** HIGH (based on analysis of 15+ competitor products across web, desktop, and mobile)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Adjustable scroll speed | Every teleprompter has this. Users need to match their speaking pace. | LOW | Slider or +/- keyboard shortcuts. Steadi already plans auto-scroll fallback with this. |
| Play/pause controls | Fundamental interaction. Users stop mid-script constantly. | LOW | Keyboard shortcut + clickable button. Already in Steadi v1 scope. |
| Font size adjustment (overlay) | Every competitor (Notchie, PromptSmart, Teleprompter Pro, Speakflow, QPrompt) offers this. Users have different monitor sizes, distances, and vision needs. | LOW | Steadi currently defers this to post-v1 --- this is risky. See note below. |
| Opacity/transparency control (overlay) | Standard across Notchie, Speakflow overlay, CloudPrompter, QPrompt. Users need to see content behind the overlay. | LOW | Also deferred in Steadi v1 scope. Risky deferral. |
| Script persistence (save/load) | Users write scripts once and reuse them. Every app has this. | MEDIUM | Already in Steadi v1 scope via file/folder tree. |
| Keyboard shortcut controls | Universal expectation. Users cannot click the overlay during presentations without looking away. | LOW | Already in Steadi v1 scope. |
| Countdown before start | Most apps (Teleprompter Pro, PromptSmart, Teleprompter.com) give 3-5 second countdown so users can get ready. | LOW | Small UX win, trivially implementable. Not in Steadi v1 scope but should be. |
| Draggable/repositionable overlay | Users have different camera positions (built-in webcam, external webcam, monitor-mounted). | LOW | Already in Steadi v1 scope with position persistence. |
| Resizable overlay window | Different scripts and contexts need different overlay sizes. Notchie, Speakflow, and Virtual Teleprompter all support this. | LOW | Should be in v1. |

**Critical note on deferred table stakes:** Steadi's PROJECT.md defers font size, opacity, and background color adjustments in the overlay to post-v1. This is a mistake. Font size and opacity are not differentiators --- they are table stakes. Every single competitor surveyed offers them. A teleprompter with fixed font size will feel broken to users. Recommend promoting font size and opacity to v1 scope.

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Invisible overlay (screen-capture hidden) | Core value prop. Only Notchie ($30, Mac-only), ScreenPrompt (Windows-only, no voice sync), and FlowPrompter (limited) offer this. No cross-platform solution exists. | HIGH | Already in Steadi v1 scope. This IS the product. Uses `NSWindow.sharingType = .none` (macOS) and `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` (Windows). |
| Voice-synced scrolling (cross-platform) | PromptSmart has VoiceTrack (patented, mobile-first). Notchie has it (Mac-only). Speakflow has Flow Mode (web-only, requires internet). No cross-platform desktop app with on-device voice sync exists. | HIGH | Already in Steadi v1 scope. macOS: word-level via SFSpeechRecognizer. Windows: cadence-based via Silero VAD. |
| Open-source and free | All competitors are paid ($15-60 one-time or $10-30/month SaaS). QPrompt is open-source but has no voice sync and no invisible overlay. Zero open-source competitors combine invisibility + voice sync. | LOW | Already decided. MIT license. Major adoption driver for developers and privacy-conscious users. |
| Full on-device privacy | Speakflow requires internet. BIGVU is cloud-based. PromptSmart works offline but is closed-source. Steadi's zero-network-calls guarantee is verifiable because it is open-source. | LOW | Already decided. Verifiable privacy is the compound differentiator (open-source + on-device). |
| Notes-app-style script editor with file tree | Most teleprompters have a bare-bones text box. Only Speakflow (with team collaboration) has a richer editing experience. A proper file-tree editor is uncommon. | MEDIUM | Already in Steadi v1 scope. This makes Steadi feel like a writing tool, not just a prompter. |
| Markdown rendering in overlay | Almost no teleprompter renders markdown. CloudPrompter has basic markdown. Most just display plain text with maybe bold/size. Rendering headers, bold, emphasis in the overlay gives visual hierarchy while reading. | MEDIUM | Already in Steadi v1 scope. Genuine differentiator that helps users scan script structure at a glance. |
| Rewind-to-sentence hotkey | No competitor offers this. PromptSmart resumes when you return to script, but has no explicit rewind. Users who lose their place have no recovery mechanism in other products. | MEDIUM | Already in Steadi v1 scope. Solves a real pain point unique to live presentations. |
| Glassmorphic design language | Teleprompter apps are universally ugly --- utilitarian UIs from the early 2010s. A premium, polished aesthetic is a visual differentiator. | MEDIUM | Already decided. Frosted glass, blur, translucency throughout. |
| Cross-platform (macOS + Windows) | Notchie is Mac-only. ScreenPrompt is Windows-only. Virtual Teleprompter is cross-platform but has no voice sync. No product combines invisibility + voice sync + cross-platform. | HIGH | Already in scope. The combination is what is new. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Steadi should deliberately NOT build these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| AI script generation/writing | BIGVU, Teleprompter.com, Speakflow, and FoxCue all add AI scriptwriting. Seems like a differentiator. | Scope explosion. Requires LLM integration, API keys or bundled models, UI for prompting. Distracts from core value (invisible overlay + voice sync). Steadi is a teleprompter, not a writing tool. Every AI feature is a maintenance burden that ages poorly. | Users write scripts in their own tools (Notion, Google Docs, Obsidian) and paste into Steadi. The markdown editor is the writing surface --- keep it simple. |
| Built-in video recording | BIGVU, PromptSmart, Teleprompter.com all bundle video recording + teleprompter. Seems natural. | Massive complexity. Video encoding, camera access, storage management, file formats. Competes with OBS, QuickTime, and native screen recording which users already have. Also conflicts with "invisible overlay" value prop (recording the overlay defeats the purpose). | Users record with their existing tools. Steadi's overlay is invisible to those tools by design. |
| Cloud sync / accounts | Speakflow, BIGVU, Teleprompter.com offer cloud sync. Seems convenient for multi-device. | Contradicts core privacy promise. Requires server infrastructure, auth, sync conflict resolution. Adds ongoing cost. Users with cross-device needs can use file sync (iCloud Drive, OneDrive, Dropbox) on their own. | Store scripts in platform-standard locations (macOS: ~/Library/Application Support, Windows: AppData). Users can point these at synced folders if they want. |
| Multi-user collaboration | BigStage Teleprompter's core feature. Speakflow has team editing. | Requires networking, real-time sync, conflict resolution, user management. Completely orthogonal to Steadi's single-user desktop focus. | Not applicable. Steadi is a personal tool. |
| Remote control from second device (phone/tablet) | Teleprompter Pro, Teleprompter.com, and PromptSmart offer control from a second device via WiFi. | Requires network discovery, pairing protocol, companion app or web server. Significant complexity. Keyboard shortcuts and hover-to-pause cover the same need more simply. | Keyboard shortcuts, presentation remotes (which register as HID keyboards), and hover-to-pause. These cover 95% of use cases. |
| Mirror/flip mode for beam splitter hardware | Professional teleprompter feature. Teleprompter Pro, QPrompt, TeleprompterPAD all support it. | Steadi targets screen-based overlay use, not hardware beam splitter rigs. Mirror mode adds UI complexity for a niche hardware use case. | Out of scope. Users with beam splitter setups use dedicated professional software. |
| AI eye contact correction | BIGVU offers this. Post-processes video to redirect gaze. | Requires ML model, video processing pipeline, GPU resources. Completely outside Steadi's scope as a live overlay tool (not a video editor). | Steadi solves eye contact the right way: positioning the overlay near the camera so users naturally look at the lens. |
| Multi-language voice recognition | PromptSmart supports 15+ languages for VoiceTrack. Seems inclusive. | Dramatically increases complexity for v1. macOS SFSpeechRecognizer supports multiple languages natively, but testing, tuning, and UX for language selection adds scope. Windows VAD is language-agnostic (cadence-based), but promoting multi-language implies word-level accuracy across languages. | Ship English-first (already decided). macOS SFSpeechRecognizer language support can be exposed later with minimal effort since Apple does the heavy lifting. Windows cadence scrolling is already language-agnostic. |
| Import from Word/PDF/RTF | Teleprompter Pro, Teleprompter.com, and PromptSmart support doc import. Seems convenient. | File parsing libraries (docx, PDF) add bundle size and complexity. PDF parsing especially is notoriously fragile. Users can copy-paste content trivially. | Paste-based workflow. Users copy from their source doc and paste into Steadi's markdown editor. If import is added later, support only .md and .txt (trivial). |

## Feature Dependencies

```
[Invisible Overlay]
    requires: Platform-specific window APIs (sharingType / DisplayAffinity)
    requires: Always-on-top window management
    enhances: [Voice-Synced Scrolling] (both are core value)

[Voice-Synced Scrolling]
    requires: [Audio Input Access] (microphone permission)
    requires: [Speech Processing Backend] (SFSpeechRecognizer or Silero VAD)
    enhances: [Overlay Display] (scrolling is how text moves in the overlay)

[Rewind-to-Sentence Hotkey]
    requires: [Voice-Synced Scrolling] OR [Auto-Scroll] (needs active scrolling to rewind)
    requires: [Script Parsing] (sentence boundary detection)
    enhances: [Voice-Synced Scrolling] (recovery from desync)

[Markdown Rendering in Overlay]
    requires: [Overlay Display] (rendering target)
    requires: [Markdown Parser] (same one used in editor preview)

[Script Editor with File Tree]
    requires: [Local File System Access] (Tauri fs plugin)
    enhances: [Overlay Display] (editor feeds content to overlay)

[Countdown Before Start]
    requires: [Overlay Display]
    enhances: [Voice-Synced Scrolling] (gives user time to prepare)

[Font Size / Opacity Controls]
    requires: [Overlay Display]
    independent of other features (pure UI customization)

[Hover-to-Pause]
    requires: [Overlay Display]
    requires: [Mouse Event Handling on Overlay]
    conflicts with: [Click-Through Mode] (if overlay passes clicks through, hover detection may not work)

[Auto-Scroll Fallback]
    independent: Works without voice sync
    enhances: [Overlay Display] (alternative scroll mechanism)
    fallback for: [Voice-Synced Scrolling] (when mic unavailable)
```

### Dependency Notes

- **Invisible Overlay is the foundation:** Everything else (voice sync, markdown rendering, controls) operates on top of the overlay. This must be built and verified first.
- **Voice sync requires audio plumbing first:** Microphone access, permissions, and audio capture must work before speech processing can be layered on.
- **Editor and overlay are decoupled but connected:** The editor creates/edits scripts, the overlay displays them. They share the file system as their integration point --- not in-memory state.
- **Hover-to-pause may conflict with click-through:** If the overlay is in click-through mode (so users can interact with apps beneath it), mouse events will not reach the overlay for hover detection. These two features need careful coordination --- likely a toggle between "interactive overlay" and "click-through overlay" modes.
- **Auto-scroll is the safety net:** If voice sync fails or the user has no mic, auto-scroll must work. Build auto-scroll first, voice sync on top.

## MVP Definition

### Launch With (v1)

Minimum viable product --- what is needed to validate the core value proposition of "invisible overlay + voice-synced scrolling."

- [x] Invisible overlay window (macOS + Windows) --- this IS the product
- [x] Voice-synced scrolling (macOS: word-level, Windows: cadence-based) --- the second half of the core value
- [x] Auto-scroll fallback (fixed speed) --- safety net when voice sync is unavailable
- [x] Play/pause/speed keyboard shortcuts --- basic control
- [x] Hover-to-pause --- quick pause without keyboard
- [x] Rewind-to-sentence hotkey --- recovery from desync
- [x] Script editor with file/folder tree --- where users write
- [x] Raw markdown editor with toggleable preview --- editing experience
- [x] Markdown rendering in overlay --- visual hierarchy while reading
- [x] Save/load scripts locally --- persistence
- [x] Draggable, repositionable overlay with position persistence --- camera alignment
- [x] Light/dark mode with glassmorphic aesthetic --- polish
- [ ] **Font size adjustment in overlay** --- PROMOTE from post-v1 (table stakes)
- [ ] **Opacity adjustment in overlay** --- PROMOTE from post-v1 (table stakes)
- [ ] **Resizable overlay window** --- PROMOTE from post-v1 (table stakes)
- [ ] **Countdown timer before scroll start (3-5 seconds)** --- trivial to implement, expected UX

### Add After Validation (v1.x)

Features to add once core is working and users provide feedback.

- [ ] Overlay background color customization --- low effort, users will ask for it
- [ ] Adjustable reading guide/highlight line --- QPrompt and Teleprompter Pro have this, helps readers track position
- [ ] Elapsed time / remaining time display --- Teleprompter Pro feature, useful for timed presentations
- [ ] Cue markers / bookmarks in scripts --- jump to sections, useful for long scripts
- [ ] Script import from .md and .txt files --- minimal parser, high convenience
- [ ] Adjustable reading area margins --- QPrompt feature, reduces eye movement for wide overlays
- [ ] Presentation remote / foot pedal support --- registers as HID keyboard, may work automatically via keyboard shortcuts
- [ ] Multi-language voice sync (macOS) --- SFSpeechRecognizer supports many languages natively; expose a language picker

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Linux support --- community demand would justify, Tauri supports it
- [ ] Dyslexia-friendly font options (OpenDyslexic, Lexend) --- accessibility win, Teleprompter.com and QPrompt offer this
- [ ] RTL language support --- Virtual Teleprompter and QPrompt support Arabic/Hebrew; needs layout rework
- [ ] Script version history / undo history --- Speakflow has revision history
- [ ] External monitor / secondary display output --- Teleprompter Pro feature for studio setups
- [ ] Plugin/extension system --- if community grows, enable extensibility
- [ ] App Store / Microsoft Store submission --- already planned as deferred

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Invisible overlay (screen-capture hidden) | HIGH | HIGH | P1 |
| Voice-synced scrolling | HIGH | HIGH | P1 |
| Auto-scroll fallback | HIGH | LOW | P1 |
| Keyboard shortcuts (play/pause/speed) | HIGH | LOW | P1 |
| Script editor with file tree | HIGH | MEDIUM | P1 |
| Markdown editor with preview | MEDIUM | MEDIUM | P1 |
| Save/load scripts locally | HIGH | LOW | P1 |
| Markdown rendering in overlay | MEDIUM | LOW | P1 |
| Hover-to-pause | MEDIUM | LOW | P1 |
| Rewind-to-sentence hotkey | HIGH | MEDIUM | P1 |
| Font size adjustment (overlay) | HIGH | LOW | P1 |
| Opacity adjustment (overlay) | MEDIUM | LOW | P1 |
| Resizable overlay | MEDIUM | LOW | P1 |
| Countdown before start | MEDIUM | LOW | P1 |
| Draggable overlay with persistence | MEDIUM | LOW | P1 |
| Light/dark mode + glassmorphic UI | MEDIUM | MEDIUM | P1 |
| Overlay background color | LOW | LOW | P2 |
| Reading guide/highlight line | MEDIUM | LOW | P2 |
| Elapsed/remaining time display | MEDIUM | LOW | P2 |
| Cue markers / bookmarks | MEDIUM | MEDIUM | P2 |
| .md/.txt file import | LOW | LOW | P2 |
| Reading area margins | LOW | LOW | P2 |
| Presentation remote support | MEDIUM | LOW | P2 |
| Multi-language voice (macOS) | MEDIUM | MEDIUM | P2 |
| Linux support | MEDIUM | MEDIUM | P3 |
| Dyslexia-friendly fonts | LOW | LOW | P3 |
| RTL language support | LOW | MEDIUM | P3 |
| Script version history | LOW | MEDIUM | P3 |
| External monitor output | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Notchie | PromptSmart | Speakflow | BigStage | Teleprompter Pro | ScreenPrompt | QPrompt | Steadi (planned) |
|---------|---------|-------------|-----------|----------|-----------------|--------------|---------|------------------|
| **Invisible overlay** | Yes (macOS notch layer) | No | No (overlay visible) | No | No | Yes (Windows only) | No (transparent but visible to capture) | Yes (both platforms) |
| **Voice-synced scroll** | Yes | Yes (VoiceTrack, patented) | Yes (Flow Mode, needs internet) | No | No | No | No | Yes (on-device) |
| **Cross-platform** | Mac only | iOS, Android, Windows, macOS | Web (all browsers) | Web (all browsers) | iOS, macOS | Windows only | Windows, macOS, Linux | macOS + Windows |
| **On-device processing** | Yes | Yes (offline) | No (requires internet) | No (web-based) | Yes | Yes | Yes | Yes |
| **Open-source** | No | No | No | No | No | Yes (Tauri) | Yes (GPL v3) | Yes (MIT) |
| **Script editor quality** | Basic text input | Basic editor | Rich editor + AI assist | Basic text input | Built-in editor | Basic text input | Rich text editor | Full markdown editor with file tree |
| **Markdown support** | No | No | No | No | No | No | No (rich text, no markdown) | Yes |
| **File/folder organization** | No | Script list | Script list + labels | Script list | Script list | No | Single file | Full file tree |
| **Pricing** | $30 one-time | $10/mo or $100/yr | $15/mo+ | Free (500 words) / paid | $20 one-time | Free | Free (GPL) | Free (MIT) |
| **Design quality** | Good (minimal) | Dated | Modern web | Basic | Professional | Basic | Functional | Premium glassmorphic |
| **Mirror/flip mode** | No | No | Yes | No | Yes | No | Yes | No (out of scope) |
| **Video recording** | No | Yes (up to 4K) | Yes (1080p in browser) | No | No | No | No | No (out of scope) |
| **AI features** | No | Yes (script gen via Llama) | Yes (writing assistant) | No | No | No | No | No (out of scope) |
| **Remote control** | No | Yes (second device) | Yes (multi-device) | Yes (multi-user) | Yes (WiFi, Bluetooth) | No | Yes (keyboard shortcuts) | No (keyboard shortcuts only) |
| **Accessibility fonts** | No | No | No | No | No | No | Yes (OpenDyslexic) | No (future) |
| **RTL support** | No | No | No | No | No | No | Yes | No (future) |
| **Countdown timer** | No | Yes | No | No | Yes | No | No | Should add |

### Competitive Positioning Summary

Steadi's unique position in the market:

1. **Only product combining:** invisible overlay + voice sync + cross-platform + open-source + on-device
2. **Closest competitor (Notchie):** Mac-only, closed-source, $30, no file organization, no markdown
3. **Closest open-source (ScreenPrompt):** Windows-only, no voice sync, basic text only
4. **Closest open-source (QPrompt):** No invisible overlay, no voice sync, GPL (not MIT)

No existing product occupies Steadi's exact niche. The combination is the differentiator, not any single feature.

## Sources

### Products Analyzed

- [Notchie](https://www.notchie.app/) --- Mac invisible teleprompter, $30, voice-synced
- [PromptSmart](https://promptsmart.com/) --- VoiceTrack technology, cross-platform mobile/desktop
- [Speakflow](https://www.speakflow.com/) --- Web-based, AI Flow Mode, team collaboration
- [BigStage Teleprompter](https://bigstageteleprompter.com/) --- Web-based, multi-user collaboration
- [Teleprompter Pro](https://teleprompterpro.com/) --- iOS/macOS, professional features, remote control
- [ScreenPrompt](https://github.com/dan0dev/ScreenPrompt) --- Windows, Tauri-based, invisible overlay, open-source
- [QPrompt](https://qprompt.app/) --- Cross-platform open-source (GPL), accessibility features
- [BIGVU](https://bigvu.tv/) --- Mobile-first, AI scriptwriting, video recording
- [Teleprompter.com](https://www.teleprompter.com/) --- Cross-platform, voice scroll, cloud sync
- [Virtual Teleprompter](https://www.vtpapps.com/) --- Windows/macOS, multilingual, RTL support
- [FlowPrompter](https://flowprompter.app/) --- Web/cross-platform, transparent overlay
- [CloudPrompter](https://guide.cloudprompter.com/) --- Web-based, transparent overlay, remote control
- [Moody](https://moody.mjarosz.com/) --- macOS notch prompter, $59, manual control
- [NotchPrompter](https://notchprompter.com/) --- macOS notch prompter, basic floating text

### Comparison and Review Sources

- [Riverside: 8 Best Teleprompter Software](https://riverside.com/blog/best-teleprompter-software)
- [Even Realities: Best Teleprompter Apps & Software 2025](https://www.evenrealities.com/blog/teleprompter-software-apps-comparison)
- [Best-Teleprompter: 15 Free Tools Tested & Ranked 2025](https://www.best-teleprompter.com/blog/best-free-teleprompter-software-2025)
- [FoxCue: 5 Common Teleprompter Troubles](https://foxcue.com/blog/common-teleprompter-issues-and-quick-resolutions/)
- [Medium: Behind the Tech of Screen-Invisible Overlay Apps](https://medium.com/@vedavyas9990/behind-the-tech-of-screen-invisible-overlay-apps-and-how-interview-cheat-tools-use-them-07bf4887c069)

---
*Feature research for: Cross-platform invisible teleprompter*
*Researched: 2026-02-15*
