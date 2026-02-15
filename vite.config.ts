// ABOUTME: Vite build configuration with multi-page support for main and overlay windows.
// ABOUTME: Uses rollupOptions.input to produce separate bundles for each Tauri window.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/main/index.html"),
        overlay: resolve(__dirname, "src/overlay/index.html"),
      },
    },
  },
});
