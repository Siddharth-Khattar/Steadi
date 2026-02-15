# Phase 2: Script Editor - Research

**Researched:** 2026-02-16
**Domain:** React markdown editor with local persistence in Tauri 2
**Confidence:** HIGH

## Summary

Phase 2 transforms the minimal main window into a full script editor with three-panel layout: collapsible sidebar file tree, plain-text markdown editor, and toggleable rendered preview. The research covers six domains: text editor library, markdown preview, panel layout, drag-and-drop reordering, local persistence, and state management.

The standard approach uses CodeMirror 6 (via `@uiw/react-codemirror`) for the editor with a custom dark theme and sans-serif font, `react-markdown` for the preview panel, `react-resizable-panels` for the split-pane layout, `@dnd-kit` for drag-and-drop reordering, Tauri 2's filesystem plugin (`@tauri-apps/plugin-fs`) for script persistence to disk, and Zustand (already implied by the tech stack constraints) for UI state management with a custom Tauri storage adapter.

**Primary recommendation:** Use `@uiw/react-codemirror` with `minimalSetup` (no line numbers, no fold gutter) plus `@codemirror/lang-markdown` for syntax highlighting, configured with a custom dark theme using a sans-serif font. Persist scripts as individual `.md` files in the `AppData` directory using Tauri's fs plugin. Use Zustand for all reactive state with a custom storage adapter backed by Tauri's store plugin for metadata/settings.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@uiw/react-codemirror` | ^4.25 | React wrapper for CodeMirror 6 editor | Most popular CM6 React binding; TypeScript-first; handles lifecycle, extensions, and state management cleanly |
| `@codemirror/lang-markdown` | ^6.5 | Markdown syntax highlighting for CM6 | Official CodeMirror markdown language package |
| `react-markdown` | ^10 | Render markdown to React elements | Safe (no `dangerouslySetInnerHTML`), virtual DOM diffing, supports remark/rehype plugins |
| `remark-gfm` | ^4 | GitHub Flavored Markdown support | Adds tables, strikethrough, task lists, and autolinks to preview |
| `react-resizable-panels` | ^4.6 | Resizable split-pane layout | 5.1k stars, TypeScript, collapsible panels, layout persistence, actively maintained (by React core contributor bvaughn) |
| `@dnd-kit/core` | ^6.3 | Drag-and-drop primitives | Modern, accessible, performant (~10kb), no external deps, hooks-based |
| `@dnd-kit/sortable` | ^10 | Sortable preset for dnd-kit | Built on `@dnd-kit/core`, provides `useSortable`, `SortableContext`, `arrayMove` |
| `@dnd-kit/utilities` | ^3 | CSS transform utilities for dnd-kit | Provides `CSS.Transform.toString()` for smooth drag animations |
| `@tauri-apps/plugin-fs` | ^2 | Filesystem access in Tauri 2 | Official Tauri plugin; read/write files, create directories, scoped security |
| `@tauri-apps/plugin-store` | ^2 | Key-value persistence in Tauri 2 | Official Tauri plugin; persists app metadata/settings as JSON; auto-save support |
| `zustand` | ^5 | State management | Already in tech stack constraints; lightweight, hooks-based, persist middleware |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@codemirror/theme-one-dark` | ^6 | Reference dark theme for CM6 | Use as a starting point or fallback; the custom theme should match the glassmorphic aesthetic |
| `@tauri-apps/api` | ^2 | Tauri core APIs (already installed) | For `invoke()` and core Tauri interop |
| `uuid` or `crypto.randomUUID()` | native | Generate unique script/folder IDs | Use `crypto.randomUUID()` (available in all modern browsers and Tauri webview) -- no extra dep needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@uiw/react-codemirror` | Raw `textarea` | Simpler but loses syntax highlighting, undo history, selection handling; CM6 is worth it for markdown editing UX |
| `@uiw/react-codemirror` | Monaco Editor | Far heavier (~2MB), designed for code IDEs not prose editors; overkill for markdown |
| `react-markdown` | `marked` + `dangerouslySetInnerHTML` | Less safe, no virtual DOM diffing, harder to style individual elements |
| `react-resizable-panels` | CSS `resize` or custom splitter | Loses collapsible behavior, layout persistence, keyboard accessibility |
| `@dnd-kit` | `react-beautiful-dnd` | Deprecated/unmaintained by Atlassian; dnd-kit is the modern standard |
| `@dnd-kit` | HTML5 drag-and-drop API | Poor UX, no touch support, limited styling control |
| Tauri fs plugin | Tauri store plugin (for scripts) | Store is for key-value pairs; scripts are files that benefit from filesystem organization |
| Tauri fs plugin | IndexedDB / localStorage | Not cross-platform persistent in Tauri; data could be lost on webview cache clear |

**Installation:**
```bash
npm install @uiw/react-codemirror @codemirror/lang-markdown @codemirror/theme-one-dark react-markdown remark-gfm react-resizable-panels @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tauri-apps/plugin-fs @tauri-apps/plugin-store zustand
```

**Tauri plugin registration (Rust side):**
```bash
cd src-tauri && cargo add tauri-plugin-fs tauri-plugin-store
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── main/
│   ├── App.tsx                  # Main window root layout (three-panel)
│   ├── index.html
│   └── main.tsx
├── components/
│   ├── ui/
│   │   └── GlassPanel.tsx       # Existing glassmorphic container
│   ├── sidebar/
│   │   ├── Sidebar.tsx          # Sidebar root (header + tree)
│   │   ├── FolderItem.tsx       # Collapsible folder with scripts
│   │   ├── ScriptItem.tsx       # Individual script entry (title + preview)
│   │   └── SidebarToolbar.tsx   # + buttons for new script/folder
│   ├── editor/
│   │   ├── ScriptEditor.tsx     # CodeMirror wrapper with auto-save
│   │   ├── editorTheme.ts       # Custom dark theme definition
│   │   └── editorExtensions.ts  # CM6 extensions bundle
│   ├── preview/
│   │   └── MarkdownPreview.tsx  # react-markdown rendered preview
│   └── toolbar/
│       └── TopBar.tsx           # "Start Teleprompter" + "Settings" buttons
├── stores/
│   ├── scriptStore.ts           # Zustand store for scripts/folders state
│   └── uiStore.ts              # Zustand store for UI state (sidebar, preview visibility)
├── persistence/
│   ├── scriptFiles.ts           # Read/write scripts to Tauri fs (AppData)
│   ├── tauriStorage.ts          # Custom Zustand storage adapter using Tauri store plugin
│   └── types.ts                 # Script, Folder, AppState type definitions
├── styles/
│   └── globals.css
└── vite-env.d.ts
```

### Pattern 1: Zustand Store with Tauri Filesystem Persistence

**What:** Scripts are stored as individual `.md` files on disk. Zustand holds the in-memory state (script metadata, content, folder structure). Changes are persisted to disk on save.

**When to use:** For script content that the user creates and edits.

**Why not Zustand persist middleware for scripts:** Script content can be large. Serializing all scripts into a single JSON blob is wasteful. Individual files allow direct filesystem access and are more debuggable.

**Example:**
```typescript
// Source: Tauri v2 fs plugin docs + Zustand patterns
import { readTextFile, writeTextFile, mkdir, readDir, exists, remove, BaseDirectory } from '@tauri-apps/plugin-fs';

const SCRIPTS_DIR = 'scripts';

interface Script {
  id: string;
  title: string;
  content: string;
  folderId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
  order: number;
  isCollapsed: boolean;
}

// Write a script to disk
async function saveScript(script: Script): Promise<void> {
  const path = `${SCRIPTS_DIR}/${script.id}.md`;
  await writeTextFile(path, script.content, {
    baseDir: BaseDirectory.AppData,
  });
}

// Read a script from disk
async function loadScript(id: string): Promise<string> {
  const path = `${SCRIPTS_DIR}/${id}.md`;
  return readTextFile(path, {
    baseDir: BaseDirectory.AppData,
  });
}
```

### Pattern 2: Metadata in Tauri Store, Content on Filesystem

**What:** Separate concerns -- script/folder metadata (titles, order, folder assignments) stored via Tauri store plugin as structured JSON. Script content stored as individual files via fs plugin.

**When to use:** Always. This is the recommended persistence architecture.

**Example:**
```typescript
// Source: Tauri v2 store plugin docs
import { load } from '@tauri-apps/plugin-store';

interface ScriptMeta {
  id: string;
  title: string;
  folderId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface AppMetadata {
  folders: Folder[];
  scripts: ScriptMeta[]; // metadata only, no content
  activeScriptId: string | null;
}

// Load metadata on app start
async function loadMetadata(): Promise<AppMetadata> {
  const store = await load('metadata.json', { autoSave: true });
  const folders = await store.get<Folder[]>('folders') ?? [];
  const scripts = await store.get<ScriptMeta[]>('scripts') ?? [];
  const activeScriptId = await store.get<string | null>('activeScriptId') ?? null;
  return { folders, scripts, activeScriptId };
}
```

### Pattern 3: Auto-Save with Debounce

**What:** Editor content auto-saves after a typing pause using a debounced callback.

**When to use:** Every keystroke triggers debounced save; ~1 second delay per CONTEXT.md.

**Example:**
```typescript
// Debounced save in the Zustand store
import { create } from 'zustand';

interface ScriptStore {
  activeContent: string;
  setContent: (content: string) => void;
}

// In the editor component:
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleEditorChange(value: string) {
  setContent(value);

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(() => {
    saveScriptToDisk(activeScriptId, value);
  }, 1000);
}
```

### Pattern 4: Collapsible Sidebar with react-resizable-panels

**What:** Three-panel layout using PanelGroup with a collapsible left panel for the sidebar.

**When to use:** The main App.tsx layout.

**Example:**
```typescript
// Source: react-resizable-panels GitHub docs
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function MainLayout() {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const previewVisible = useUIStore((s) => s.previewVisible);

  return (
    <PanelGroup direction="horizontal" autoSaveId="main-layout">
      {sidebarVisible && (
        <>
          <Panel
            id="sidebar"
            defaultSize={25}
            minSize={15}
            maxSize={40}
            order={1}
            collapsible
          >
            <Sidebar />
          </Panel>
          <PanelResizeHandle className="w-px bg-white/10 hover:bg-white/20 transition-colors" />
        </>
      )}
      <Panel id="editor" order={2} minSize={30}>
        <ScriptEditor />
      </Panel>
      {previewVisible && (
        <>
          <PanelResizeHandle className="w-px bg-white/10 hover:bg-white/20 transition-colors" />
          <Panel
            id="preview"
            defaultSize={50}
            minSize={20}
            order={3}
          >
            <MarkdownPreview />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}
```

### Pattern 5: DnD-Kit Sortable for File Tree Reordering

**What:** Scripts can be reordered within folders and dragged between folders using `@dnd-kit/sortable`.

**When to use:** Sidebar file tree interactions.

**Example:**
```typescript
// Source: dnd-kit official docs
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableScriptItem({ id, title, preview }: { id: string; title: string; preview: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="text-sm text-white/90 font-medium truncate">{title}</div>
      <div className="text-xs text-white/40 truncate">{preview}</div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Storing all script content in Zustand persist:** Large text content serialized into a single JSON blob is slow and wastes memory. Store content on filesystem, metadata in store.
- **Using `dangerouslySetInnerHTML` for markdown preview:** Use `react-markdown` which builds a virtual DOM safely.
- **Using CodeMirror `basicSetup` without customization:** It includes line numbers, fold gutters, and other code-editor features that conflict with the distraction-free notes-app aesthetic. Use `minimalSetup` or build a custom extension set.
- **Building custom resize handles:** `react-resizable-panels` handles all the pointer math, keyboard accessibility, and edge cases. Do not hand-roll.
- **Using localStorage/sessionStorage in Tauri:** The webview storage can be cleared unpredictably. Use Tauri's native persistence APIs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Split-pane resizable layout | Custom mouse-drag divider logic | `react-resizable-panels` | Handles pointer capture, min/max constraints, keyboard accessibility, layout persistence, collapsible behavior |
| Drag-and-drop reordering | Custom mousedown/mousemove handlers | `@dnd-kit/sortable` | Handles touch support, accessibility (keyboard DnD), collision detection, scroll containers, overlay rendering |
| Markdown rendering | Regex-based markdown parser | `react-markdown` with `remark-gfm` | Handles edge cases in markdown spec, XSS prevention, plugin ecosystem |
| Text editor with undo/redo | Raw textarea with manual history | `@uiw/react-codemirror` | Handles undo/redo stack, selection, clipboard, IME input, accessibility |
| File persistence | Custom IPC commands | `@tauri-apps/plugin-fs` | Official plugin with scoped security, cross-platform path resolution, permission system |
| Debounce function | Custom setTimeout wrapper | `setTimeout`/`clearTimeout` in a ref | Simple enough that a utility library is overkill; a ref-based pattern is sufficient |

**Key insight:** The entire editing UX relies on well-tested interaction primitives. Every custom implementation of resize, drag-drop, or text editing will have edge cases around accessibility, touch input, and keyboard navigation that established libraries handle.

## Common Pitfalls

### Pitfall 1: Tauri AppData Directory Not Created Automatically
**What goes wrong:** `writeTextFile` fails because the `scripts/` subdirectory does not exist under AppData.
**Why it happens:** Tauri does not auto-create directories. The AppData base directory may not exist on first launch.
**How to avoid:** On app startup, call `mkdir('scripts', { baseDir: BaseDirectory.AppData, recursive: true })` to ensure the directory exists before any read/write operations.
**Warning signs:** `writeTextFile` throws "No such file or directory" errors.

### Pitfall 2: CodeMirror State vs React State Mismatch
**What goes wrong:** The editor shows stale content, or content jumps when switching scripts.
**Why it happens:** CodeMirror 6 manages its own internal state. If React re-renders and passes a new `value` prop, the editor may fight with its internal state. The `@uiw/react-codemirror` wrapper handles most of this, but switching between scripts (different documents) requires care.
**How to avoid:** Use a `key` prop on the CodeMirror component tied to the active script ID: `<CodeMirror key={activeScriptId} value={content} />`. This forces a full remount when switching scripts, cleanly resetting editor state.
**Warning signs:** Content flickers, undo history persists across script switches, or cursor position jumps.

### Pitfall 3: Tauri FS Permissions Not Configured
**What goes wrong:** All filesystem operations silently fail or throw permission errors.
**Why it happens:** Tauri 2's security model requires explicit permission grants in capability files. The default `fs:default` only grants read access to app directories.
**How to avoid:** Add granular fs permissions to `src-tauri/capabilities/main-window.json` including write, mkdir, remove, rename, and AppData scope permissions.
**Warning signs:** Operations fail with "Not allowed" or "Permission denied" errors.

### Pitfall 4: Auto-Save Race Conditions
**What goes wrong:** Rapidly switching scripts while a save is pending causes content to be saved to the wrong file.
**Why it happens:** The debounced save fires after the active script has changed.
**How to avoid:** Capture the script ID at the time of the edit, not at the time of the save. The debounced callback should close over the script ID: `setTimeout(() => saveScript(capturedId, capturedContent), 1000)`. Also flush pending saves before switching scripts.
**Warning signs:** Script content appears in the wrong file after rapid switching.

### Pitfall 5: CSS Conflicts Between CodeMirror and Tailwind
**What goes wrong:** CodeMirror's styles are overridden by Tailwind's reset/base styles, causing visual glitches.
**Why it happens:** Tailwind v4 applies CSS resets and `box-sizing: border-box` globally that can interfere with CodeMirror's internal layout calculations.
**How to avoid:** CodeMirror uses its own scoped CSS-in-JS system. The custom theme via `EditorView.theme()` takes precedence. If issues arise, ensure the CodeMirror container is not affected by conflicting flex/grid parent styles. Set explicit height on the editor container.
**Warning signs:** Editor content overlaps gutters, scrollbar behaves erratically, cursor position is offset.

### Pitfall 6: user-select: none in globals.css Breaks Editor
**What goes wrong:** User cannot select text in the CodeMirror editor.
**Why it happens:** The existing `globals.css` sets `user-select: none` and `-webkit-user-select: none` on `html, body`. This cascades into the editor.
**How to avoid:** Override `user-select` on the editor container: set `user-select: text` and `-webkit-user-select: text` on the `.cm-editor` or its parent. Alternatively, scope the global `user-select: none` to only apply to non-editor areas, or remove it from the main window (it is more relevant to the overlay window).
**Warning signs:** Cannot select text in editor, cursor does not appear on click.

### Pitfall 7: Drag-and-Drop Between Folders Requires Multi-Container Setup
**What goes wrong:** Scripts can be reordered within a folder but not dragged to a different folder.
**Why it happens:** `@dnd-kit/sortable` requires separate `SortableContext` providers for each container (folder). Moving items between containers requires `onDragOver` handling, not just `onDragEnd`.
**How to avoid:** Wrap each folder's script list in its own `SortableContext`. Use `onDragOver` to transfer items between containers, and `onDragEnd` for final placement. Use `DragOverlay` for smooth cross-container dragging.
**Warning signs:** Items snap back when dropped outside their original container.

## Code Examples

### Custom Dark Theme for CodeMirror (iA Writer Style)

```typescript
// Source: CodeMirror styling docs (codemirror.net/examples/styling/)
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const steaidiEditorTheme = EditorView.theme({
  '&': {
    color: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'transparent',
    fontFamily: '"Inter", "SF Pro Text", -apple-system, sans-serif',
    fontSize: '16px',
    lineHeight: '1.7',
  },
  '.cm-content': {
    caretColor: '#ffffff',
    padding: '24px 32px',
    fontFamily: 'inherit',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#ffffff',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  // Hide gutters for distraction-free editing
  '.cm-gutters': {
    display: 'none',
  },
}, { dark: true });

export const steadiHighlightStyle = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.heading1, color: '#ffffff', fontWeight: 'bold', fontSize: '1.4em' },
  { tag: tags.heading2, color: '#ffffff', fontWeight: 'bold', fontSize: '1.2em' },
  { tag: tags.heading3, color: '#ffffff', fontWeight: 'bold', fontSize: '1.1em' },
  { tag: tags.emphasis, color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' },
  { tag: tags.strong, color: '#ffffff', fontWeight: 'bold' },
  { tag: tags.link, color: 'rgba(130, 170, 255, 0.9)', textDecoration: 'underline' },
  { tag: tags.url, color: 'rgba(130, 170, 255, 0.7)' },
  { tag: tags.quote, color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' },
  { tag: tags.monospace, color: 'rgba(255, 200, 120, 0.9)' },
  { tag: tags.processingInstruction, color: 'rgba(255, 255, 255, 0.3)' },
]));
```

### CodeMirror Editor Component

```typescript
// Source: @uiw/react-codemirror GitHub + CodeMirror docs
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { steaidiEditorTheme, steadiHighlightStyle } from './editorTheme';

interface ScriptEditorProps {
  scriptId: string;
  content: string;
  onChange: (value: string) => void;
}

export function ScriptEditor({ scriptId, content, onChange }: ScriptEditorProps) {
  const extensions = [
    markdown(),
    EditorView.lineWrapping,
    steadiHighlightStyle,
  ];

  return (
    <div className="h-full [&_.cm-editor]:h-full [&_.cm-editor]:select-text">
      <CodeMirror
        key={scriptId}
        value={content}
        onChange={onChange}
        theme={steaidiEditorTheme}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          highlightSelectionMatches: false,
          searchKeymap: true,
        }}
      />
    </div>
  );
}
```

### Markdown Preview Component

```typescript
// Source: react-markdown GitHub docs
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="h-full overflow-auto p-8 text-white/80 prose prose-invert prose-sm max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}
```

### Tauri FS Permissions Configuration

```json
// Source: Tauri v2 filesystem plugin docs
// File: src-tauri/capabilities/main-window.json
{
  "identifier": "main-capability",
  "description": "Permissions for the main control window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-read-dir",
    "fs:allow-mkdir",
    "fs:allow-remove",
    "fs:allow-rename",
    "fs:allow-exists",
    "fs:allow-stat",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "$APPDATA" },
        { "path": "$APPDATA/**" }
      ]
    },
    "store:default"
  ]
}
```

### Tauri Plugin Registration (Rust)

```rust
// In src-tauri/src/lib.rs, add to the Builder chain:
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    // ... existing plugins
```

### Custom Zustand Storage Adapter for Tauri Store

```typescript
// Source: Zustand persist docs + Tauri store plugin docs
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { load, type Store } from '@tauri-apps/plugin-store';

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load('app-state.json', { autoSave: true });
  }
  return storeInstance;
}

export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const store = await getStore();
    return (await store.get<string>(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const store = await getStore();
    await store.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    const store = await getStore();
    await store.delete(name);
  },
};

export const tauriJSONStorage = createJSONStorage(() => tauriStorage);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-beautiful-dnd` | `@dnd-kit` | 2022+ | react-beautiful-dnd is unmaintained; dnd-kit is the modern standard |
| CodeMirror 5 | CodeMirror 6 | 2022+ | CM6 is a full rewrite; modular, TypeScript, better performance |
| Tauri 1 fs API | Tauri 2 `@tauri-apps/plugin-fs` | 2024 | Plugin-based architecture, scoped security model, capability files |
| Zustand v4 `getStorage` | Zustand v5 `createJSONStorage` | 2024 | New API for custom storage; `getStorage` is deprecated |
| `react-markdown` v8 (CommonMark only) | `react-markdown` v10 | 2024 | Better plugin support, ESM-only |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Officially deprecated by Atlassian. Use `@dnd-kit` instead.
- Tauri 1 `tauri::api::fs`: Replaced by plugin-based `@tauri-apps/plugin-fs` in Tauri 2.
- Zustand `getStorage`: Use `createJSONStorage` in Zustand v5.

## Open Questions

1. **Tailwind `prose` classes in dark mode:**
   - What we know: Tailwind v4 includes `@tailwindcss/typography` but the `prose` class and `prose-invert` may need the typography plugin to be explicitly installed.
   - What's unclear: Whether Tailwind v4 bundles `@tailwindcss/typography` or if it needs separate installation.
   - Recommendation: Check if `prose` classes work out of the box. If not, install `@tailwindcss/typography` as a dependency.

2. **Exact dnd-kit version compatibility:**
   - What we know: `@dnd-kit/core` is at 6.3.1, `@dnd-kit/sortable` peer-depends on it. There is also a newer `@dnd-kit/react` package.
   - What's unclear: Whether `@dnd-kit/react` is a replacement for `@dnd-kit/core` + `@dnd-kit/sortable` or a separate package.
   - Recommendation: Use the established `@dnd-kit/core` + `@dnd-kit/sortable` combination which has extensive documentation and examples.

3. **`user-select: none` scope:**
   - What we know: `globals.css` applies `user-select: none` to `html, body`. This will break text selection in CodeMirror.
   - What's unclear: Whether the overlay window also uses this CSS file (it imports the same `globals.css`).
   - Recommendation: Scope `user-select: none` to non-editor areas, or override it on the editor container. Since both windows share `globals.css`, moving to window-specific styles may be needed.

4. **Tauri Store plugin vs fs plugin for metadata:**
   - What we know: Both can persist data. Store is key-value with auto-save; fs is file-based.
   - What's unclear: Whether the store plugin has size limits or performance issues with larger metadata sets.
   - Recommendation: Use store plugin for metadata (folder structure, script ordering, UI preferences). It is designed for this use case and handles serialization automatically.

## Sources

### Primary (HIGH confidence)
- [Tauri 2 Filesystem Plugin](https://v2.tauri.app/plugin/file-system/) - Installation, API, permissions, BaseDirectory usage
- [Tauri 2 Store Plugin](https://v2.tauri.app/plugin/store/) - Key-value persistence setup and API
- [CodeMirror 6 Styling Guide](https://codemirror.net/examples/styling/) - Custom theme creation, dark mode, font configuration
- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) - API, collapsible panels, version (4.6.4)
- [dnd-kit Sortable Docs](https://dndkit.com/presets/sortable) - SortableContext, useSortable, multi-container patterns
- [Tauri 2 Permissions Reference](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/fs/permissions/autogenerated/reference.md) - fs permission identifiers
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - createJSONStorage, custom async storage

### Secondary (MEDIUM confidence)
- [@uiw/react-codemirror GitHub](https://github.com/uiwjs/react-codemirror) - React wrapper API, version 4.25.x
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Usage with remark-gfm, version 10.x
- [@codemirror/lang-markdown npm](https://www.npmjs.com/package/@codemirror/lang-markdown) - Markdown language support, version 6.5.x

### Tertiary (LOW confidence)
- Version numbers for some packages were found via WebSearch summaries and may not reflect the absolute latest. Verify at install time.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified through official documentation and GitHub repos
- Architecture: HIGH - Patterns derived from official library examples and Tauri plugin docs
- Pitfalls: HIGH - Identified from official docs, known Tauri 2 behaviors, and CodeMirror documentation
- Persistence: HIGH - Tauri fs and store plugin APIs verified through official v2 docs
- DnD implementation: MEDIUM - Multi-container dnd-kit pattern is well-documented but application-specific details (folder-to-folder drag) need implementation-time validation

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable ecosystem, 30-day validity)
