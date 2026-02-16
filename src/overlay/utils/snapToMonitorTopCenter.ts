// ABOUTME: Snaps the overlay window to the horizontal center and vertical top of its current monitor.
// ABOUTME: Used after drag-release, resize, and geometry restore to enforce consistent positioning.

import {
  getCurrentWindow,
  currentMonitor,
  primaryMonitor,
} from "@tauri-apps/api/window";
import { LogicalPosition } from "@tauri-apps/api/dpi";

/** Geometry returned after snapping, in logical pixels. */
export interface SnappedGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Snaps the current overlay window to the top-center of whichever monitor
 * it's currently on. Falls back to the primary monitor if `currentMonitor()`
 * returns null (e.g. window is between screens during a drag).
 *
 * @returns The snapped geometry in logical pixels, for persistence.
 */
export async function snapToMonitorTopCenter(): Promise<SnappedGeometry> {
  const appWindow = getCurrentWindow();

  const monitor =
    (await currentMonitor()) ?? (await primaryMonitor());

  if (!monitor) {
    throw new Error("No monitor available for snap positioning");
  }

  const scale = monitor.scaleFactor;
  const monitorX = monitor.position.x / scale;
  const monitorY = monitor.position.y / scale;
  const monitorWidth = monitor.size.width / scale;

  const physSize = await appWindow.innerSize();
  const overlayWidth = physSize.width / scale;
  const overlayHeight = physSize.height / scale;

  const x = Math.round(monitorX + (monitorWidth - overlayWidth) / 2);
  const y = Math.round(monitorY);

  await appWindow.setPosition(new LogicalPosition(x, y));

  return { x, y, width: overlayWidth, height: overlayHeight };
}
