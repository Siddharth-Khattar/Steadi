// ABOUTME: Domain type definitions for scripts, folders, and app metadata.
// ABOUTME: Shared across persistence layer and Zustand stores.

/** A single teleprompter script with full content. */
export interface Script {
  id: string;
  title: string;
  content: string;
  folderId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Script metadata without content, used for persistence in the Tauri store. */
export interface ScriptMeta {
  id: string;
  title: string;
  /** Short plain-text snippet from the body, derived on save. Optional for backward compat. */
  preview?: string;
  folderId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** A folder that contains scripts. Single-level only (no nesting). */
export interface Folder {
  id: string;
  name: string;
  order: number;
  isCollapsed: boolean;
}

/** Top-level metadata structure persisted via Tauri store plugin. */
export interface AppMetadata {
  folders: Folder[];
  scripts: ScriptMeta[];
  activeScriptId: string | null;
}
