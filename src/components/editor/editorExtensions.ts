// ABOUTME: Bundled CodeMirror 6 extensions for markdown editing in Steadi.
// ABOUTME: Combines markdown language support, line wrapping, and custom syntax highlighting.

import { markdown } from "@codemirror/lang-markdown";
import { type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { steadiHighlightStyle } from "./editorTheme";

/**
 * Pre-configured extension array for the Steadi markdown editor.
 * Includes markdown language support, soft line wrapping for prose,
 * and the custom highlight style for markdown tokens.
 */
export const steadiExtensions: Extension[] = [
  markdown(),
  EditorView.lineWrapping,
  steadiHighlightStyle,
];
