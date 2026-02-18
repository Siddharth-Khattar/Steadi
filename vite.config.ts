// ABOUTME: Vite build configuration with multi-page support for main, overlay, and editor-fab windows.
// ABOUTME: Uses rollupOptions.input to produce separate bundles for each Tauri window.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  root: "src",
  plugins: [react(), tailwindcss()],

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/main/index.html"),
        overlay: resolve(__dirname, "src/overlay/index.html"),
        "editor-fab": resolve(__dirname, "src/editor-fab/index.html"),
      },
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;

          // React core — shared by all entry points
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          // CodeMirror core — view, state, and tightly coupled internals
          if (
            id.includes("/@codemirror/view") ||
            id.includes("/@codemirror/state") ||
            id.includes("/crelt/") ||
            id.includes("/style-mod/") ||
            id.includes("/w3c-keyname/")
          ) {
            return "vendor-cm-core";
          }

          // CodeMirror extensions, language support, and React wrappers
          if (
            id.includes("/@codemirror/") ||
            id.includes("/@uiw/react-codemirror") ||
            id.includes("/@uiw/codemirror-") ||
            id.includes("/@lezer/") ||
            id.includes("/codemirror/")
          ) {
            return "vendor-cm-ext";
          }

          // Markdown rendering — shared by main (preview) and overlay
          if (
            id.includes("/react-markdown/") ||
            id.includes("/remark-") ||
            id.includes("/unified/") ||
            id.includes("/mdast-") ||
            id.includes("/micromark") ||
            id.includes("/unist-") ||
            id.includes("/hast-") ||
            id.includes("/devlop/") ||
            id.includes("/vfile") ||
            id.includes("/bail/") ||
            id.includes("/trough/") ||
            id.includes("/property-information/") ||
            id.includes("/space-separated-tokens/") ||
            id.includes("/comma-separated-tokens/") ||
            id.includes("/ccount/") ||
            id.includes("/decode-named-character-reference/") ||
            id.includes("/trim-lines/") ||
            id.includes("/html-void-elements/") ||
            id.includes("/stringify-entities/") ||
            id.includes("/character-entities")
          ) {
            return "vendor-markdown";
          }

          // Drag-and-drop — only used by main window sidebar
          if (id.includes("/@dnd-kit/")) {
            return "vendor-dnd";
          }

          // Tauri APIs — shared by all entry points
          if (id.includes("/@tauri-apps/")) {
            return "vendor-tauri";
          }
        },
      },
    },
  },
});
