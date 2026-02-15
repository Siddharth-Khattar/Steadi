// ABOUTME: ESLint 9 flat config for TypeScript + React with recommended rules.
// ABOUTME: Uses typescript-eslint (non-type-checked) and react-hooks plugin.

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default defineConfig(
  {
    ignores: ["dist/", "src-tauri/", "node_modules/"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
);
