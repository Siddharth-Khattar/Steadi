// ABOUTME: Hook to persist and restore overlay window position and size across app restarts.
// ABOUTME: Listens for window move/resize events, debounces saves to Tauri store, restores geometry on mount.

import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { load } from "@tauri-apps/plugin-store";

interface OverlayGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STORE_PATH = "overlay-geometry.json";
const STORE_KEY = "overlay-geometry";
const DEBOUNCE_MS = 300;

/**
 * Persists overlay window position and size to a Tauri store and restores
 * it on mount. Listens for onMoved / onResized events with debounced saving
 * to avoid excessive disk writes during active dragging.
 */
export function useOverlayGeometry(): void {
  useEffect(() => {
    const window = getCurrentWindow();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingGeometry: Partial<OverlayGeometry> = {};
    const unlistenFns: Array<() => void> = [];

    async function saveGeometry(geo: Partial<OverlayGeometry>): Promise<void> {
      try {
        const store = await load(STORE_PATH, { autoSave: true, defaults: {} });
        const existing =
          (await store.get<OverlayGeometry>(STORE_KEY)) ?? undefined;
        const merged: OverlayGeometry = {
          x: geo.x ?? existing?.x ?? 0,
          y: geo.y ?? existing?.y ?? 0,
          width: geo.width ?? existing?.width ?? 400,
          height: geo.height ?? existing?.height ?? 140,
        };
        await store.set(STORE_KEY, merged);
      } catch (err) {
        console.error("Failed to save overlay geometry:", err);
      }
    }

    function debouncedSave(partial: Partial<OverlayGeometry>): void {
      pendingGeometry = { ...pendingGeometry, ...partial };
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        void saveGeometry(pendingGeometry);
        pendingGeometry = {};
        debounceTimer = null;
      }, DEBOUNCE_MS);
    }

    async function restoreGeometry(): Promise<void> {
      try {
        const store = await load(STORE_PATH, { autoSave: true, defaults: {} });
        const geo = await store.get<OverlayGeometry>(STORE_KEY);
        if (!geo) return;

        await window.setPosition(new LogicalPosition(geo.x, geo.y));
        await window.setSize(new LogicalSize(geo.width, geo.height));
      } catch (err) {
        console.error("Failed to restore overlay geometry:", err);
      }
    }

    async function setup(): Promise<void> {
      await restoreGeometry();

      const unlistenMoved = await window.onMoved(async ({ payload }) => {
        const scale = await window.scaleFactor();
        const logical = payload.toLogical(scale);
        debouncedSave({ x: logical.x, y: logical.y });
      });
      unlistenFns.push(unlistenMoved);

      const unlistenResized = await window.onResized(async ({ payload }) => {
        const scale = await window.scaleFactor();
        const logical = payload.toLogical(scale);
        debouncedSave({ width: logical.width, height: logical.height });
      });
      unlistenFns.push(unlistenResized);
    }

    void setup();

    return () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, []);
}
