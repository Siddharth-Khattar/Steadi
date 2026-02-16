// ABOUTME: Filesystem operations for script content using Tauri fs plugin.
// ABOUTME: Scripts are stored as individual .md files in AppData/scripts/.

import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
  remove,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

const SCRIPTS_DIR = "scripts";

/**
 * Ensures the scripts directory exists under AppData.
 * Must be called on app startup before any read/write operations.
 */
export async function initScriptsDir(): Promise<void> {
  await mkdir(SCRIPTS_DIR, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  });
}

/** Writes script content to `scripts/{id}.md` in AppData. */
export async function saveScriptContent(
  id: string,
  content: string,
): Promise<void> {
  const path = `${SCRIPTS_DIR}/${id}.md`;
  await writeTextFile(path, content, {
    baseDir: BaseDirectory.AppData,
  });
}

/**
 * Reads script content from `scripts/{id}.md` in AppData.
 * Returns an empty string if the file does not exist.
 */
export async function loadScriptContent(id: string): Promise<string> {
  const path = `${SCRIPTS_DIR}/${id}.md`;

  const fileExists = await exists(path, {
    baseDir: BaseDirectory.AppData,
  });

  if (!fileExists) {
    return "";
  }

  return readTextFile(path, {
    baseDir: BaseDirectory.AppData,
  });
}

/**
 * Removes `scripts/{id}.md` from AppData.
 * Silently succeeds if the file does not exist.
 */
export async function deleteScriptFile(id: string): Promise<void> {
  const path = `${SCRIPTS_DIR}/${id}.md`;

  const fileExists = await exists(path, {
    baseDir: BaseDirectory.AppData,
  });

  if (!fileExists) {
    return;
  }

  await remove(path, {
    baseDir: BaseDirectory.AppData,
  });
}
