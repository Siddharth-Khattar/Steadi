// ABOUTME: CodeMirror-based markdown editor with debounced auto-save for teleprompter scripts.
// ABOUTME: Reads from and writes to the Zustand script store, handles script switching via key-based remount.

import { useCallback, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { useScriptStore } from "../../stores/scriptStore";
import { steadiEditorTheme } from "./editorTheme";
import { steadiExtensions } from "./editorExtensions";

const AUTO_SAVE_DELAY_MS = 1000;

/**
 * Distraction-free markdown editor wired to the script store.
 *
 * Uses key={activeScriptId} to force a clean remount on script switch,
 * avoiding stale CodeMirror internal state. Content is auto-saved to
 * disk after 1 second of inactivity via a debounced timeout.
 */
export function ScriptEditor() {
  const activeScriptId = useScriptStore((s) => s.activeScriptId);
  const activeContent = useScriptStore((s) => s.activeContent);
  const setContent = useScriptStore((s) => s.setContent);
  const saveActiveContent = useScriptStore((s) => s.saveActiveContent);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * When a newly created script opens with "# Untitled", select just the
   * heading text so the user can type to replace it immediately.
   */
  const handleCreateEditor = useCallback((view: EditorView) => {
    const firstLine = view.state.doc.line(1);
    const match = firstLine.text.match(/^#\s+(Untitled)$/);
    if (match) {
      // Select only the "Untitled" text, not the "# " prefix
      const prefixLength = firstLine.text.indexOf(match[1]);
      const from = firstLine.from + prefixLength;
      const to = from + match[1].length;
      view.dispatch({
        selection: { anchor: from, head: to },
      });
    }
  }, []);

  // Flush any pending debounced save on unmount instead of discarding it.
  // On script switch setActiveScript already saves, making this a harmless
  // no-op; on app/window close it ensures the last keystrokes reach disk.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        useScriptStore.getState().saveActiveContent();
      }
    };
  }, []);

  // Cmd/Ctrl+S: immediately flush to disk instead of waiting for the debounce timer.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        saveActiveContent();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveActiveContent]);

  const handleChange = useCallback(
    (value: string) => {
      // Update in-memory state immediately
      setContent(value);

      // Debounce the filesystem save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveActiveContent();
      }, AUTO_SAVE_DELAY_MS);
    },
    [setContent, saveActiveContent],
  );

  if (!activeScriptId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-white/40 text-sm">
          Select or create a script to start writing
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ userSelect: "text", WebkitUserSelect: "text" }}
    >
      <CodeMirror
        key={activeScriptId}
        className="h-full"
        height="100%"
        value={activeContent}
        onChange={handleChange}
        theme={steadiEditorTheme}
        extensions={steadiExtensions}
        autoFocus
        onCreateEditor={handleCreateEditor}
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
