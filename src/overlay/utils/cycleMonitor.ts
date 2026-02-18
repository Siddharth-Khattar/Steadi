// ABOUTME: Moves the overlay window to the next monitor in the available monitors cycle.
// ABOUTME: After moving, snaps the overlay to top-center of the target monitor.

import {
  getCurrentWindow,
  currentMonitor,
  availableMonitors,
} from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import type { Monitor } from "@tauri-apps/api/window";
import { snapToMonitorTopCenter } from "./snapToMonitorTopCenter";

/**
 * Cycles the overlay window to the next monitor in the system's monitor list.
 *
 * Determines which monitor the overlay is currently on, finds the next one
 * in the `availableMonitors()` list (wrapping around), moves the window onto
 * that monitor, then delegates to `snapToMonitorTopCenter()` for precise
 * centering (avoids cross-DPI scale factor mismatches).
 *
 * Uses physical coordinates for the initial move to prevent DPI mismatch
 * issues when the source and target monitors have different scale factors.
 *
 * No-op if only one monitor is available.
 */
export async function cycleMonitor(): Promise<void> {
  const monitors = await availableMonitors();
  if (monitors.length <= 1) return;

  const current = await currentMonitor();
  const appWindow = getCurrentWindow();

  // Find the index of the current monitor by matching its name and position
  const currentIndex = current
    ? monitors.findIndex((m) => monitorsMatch(m, current))
    : 0;

  const nextIndex = (currentIndex + 1) % monitors.length;
  const target = monitors[nextIndex];

  // Move to the target monitor's origin using physical coordinates so the
  // position is unambiguous regardless of the source monitor's DPI.
  await appWindow.setPosition(
    new PhysicalPosition(target.position.x, target.position.y),
  );

  // Snap to top-center using the target monitor's actual dimensions/scale
  await snapToMonitorTopCenter();
}

/** Compares two monitors by name and physical position to determine identity. */
function monitorsMatch(a: Monitor, b: Monitor): boolean {
  return (
    a.name === b.name &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y
  );
}
