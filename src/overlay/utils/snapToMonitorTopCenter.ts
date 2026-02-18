// ABOUTME: Snaps the overlay window to the horizontal center and vertical top of its current monitor.
// ABOUTME: Used after drag-release, resize, and geometry restore to enforce consistent positioning.

import {
  getCurrentWindow,
  currentMonitor,
  primaryMonitor,
} from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";

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
 * Uses physical coordinates for `setPosition` to avoid cross-platform
 * logical-to-physical conversion issues (see editor_fab.rs for rationale).
 *
 * @returns The snapped geometry in logical pixels, for persistence.
 */
export async function snapToMonitorTopCenter(): Promise<SnappedGeometry> {
  const appWindow = getCurrentWindow();

  const monitor = (await currentMonitor()) ?? (await primaryMonitor());

  if (!monitor) {
    throw new Error("No monitor available for snap positioning");
  }

  const scale = monitor.scaleFactor;

  // Monitor position is already in physical pixels.
  const monPhysX = monitor.position.x;
  const monPhysY = monitor.position.y;
  const monPhysW = monitor.size.width;

  // Current overlay size in physical pixels.
  const physSize = await appWindow.innerSize();

  // Center the overlay horizontally within the monitor, in physical pixels.
  const physX = Math.round(monPhysX + (monPhysW - physSize.width) / 2);
  const physY = Math.round(monPhysY);

  await appWindow.setPosition(new PhysicalPosition(physX, physY));

  // Return logical values for persistence.
  const overlayWidth = physSize.width / scale;
  const overlayHeight = physSize.height / scale;
  return {
    x: physX / scale,
    y: physY / scale,
    width: overlayWidth,
    height: overlayHeight,
  };
}
