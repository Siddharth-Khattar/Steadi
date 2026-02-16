// ABOUTME: Custom dark CodeMirror 6 theme for the Steadi script editor.
// ABOUTME: Provides a distraction-free, notes-app aesthetic with sans-serif font and markdown-appropriate syntax colors.

import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * Custom dark CodeMirror theme styled for prose editing.
 * Uses sans-serif font, hidden gutters, and subtle selection colors
 * to create a distraction-free writing surface.
 */
export const steadiEditorTheme = EditorView.theme(
  {
    "&": {
      color: "rgba(255, 255, 255, 0.85)",
      backgroundColor: "transparent",
      fontFamily: '"Inter", "SF Pro Text", -apple-system, sans-serif',
      fontSize: "16px",
      lineHeight: "1.7",
    },
    ".cm-content": {
      caretColor: "#ffffff",
      padding: "24px 32px",
      fontFamily: "inherit",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#ffffff",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    // Hide gutters for distraction-free editing
    ".cm-gutters": {
      display: "none",
    },
  },
  { dark: true },
);

/**
 * Syntax highlighting styles optimized for markdown content.
 * Headings are prominent, syntax characters are de-emphasized,
 * and links use a soft blue accent.
 */
export const steadiHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: tags.heading1,
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "1.4em",
    },
    {
      tag: tags.heading2,
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "1.2em",
    },
    {
      tag: tags.heading3,
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: "1.1em",
    },
    {
      tag: tags.emphasis,
      color: "rgba(255, 255, 255, 0.85)",
      fontStyle: "italic",
    },
    { tag: tags.strong, color: "#ffffff", fontWeight: "bold" },
    {
      tag: tags.link,
      color: "rgba(130, 170, 255, 0.9)",
      textDecoration: "underline",
    },
    { tag: tags.url, color: "rgba(130, 170, 255, 0.7)" },
    {
      tag: tags.quote,
      color: "rgba(255, 255, 255, 0.5)",
      fontStyle: "italic",
    },
    { tag: tags.monospace, color: "rgba(255, 200, 120, 0.9)" },
    // De-emphasize markdown syntax characters (e.g. #, **, [])
    { tag: tags.processingInstruction, color: "rgba(255, 255, 255, 0.3)" },
  ]),
);
