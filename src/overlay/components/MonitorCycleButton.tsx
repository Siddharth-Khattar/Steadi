// ABOUTME: Small button in the overlay top-right to cycle the overlay to the next monitor.
// ABOUTME: Only renders when multiple monitors are detected; hidden on single-monitor setups.

import { useState, useEffect } from "react";
import { availableMonitors } from "@tauri-apps/api/window";
import { cycleMonitor } from "../utils/cycleMonitor";

/**
 * A small blue circular button positioned at the top-right of the overlay.
 * Clicking it moves the overlay to the next monitor in the available monitors
 * cycle, snapping to top-center.
 *
 * Automatically hides when only one monitor is connected.
 */
export function MonitorCycleButton() {
  const [multiMonitor, setMultiMonitor] = useState(false);

  useEffect(() => {
    async function checkMonitors() {
      try {
        const monitors = await availableMonitors();
        setMultiMonitor(monitors.length > 1);
      } catch {
        // If monitor detection fails, hide the button
        setMultiMonitor(false);
      }
    }

    void checkMonitors();

    // Re-check periodically in case monitors are connected/disconnected
    const interval = setInterval(() => void checkMonitors(), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!multiMonitor) return null;

  const handleClick = async () => {
    try {
      await cycleMonitor();
    } catch (err) {
      console.error("Failed to cycle monitor:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Move to next screen"
      aria-label="Move to next screen"
      className="absolute top-1.5 right-2 z-50 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
    >
      {/* Swap / interchange icon (two opposing arrows) */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        <path d="M8 3 4 7l4 4" />
        <path d="M4 7h16" />
        <path d="m16 21 4-4-4-4" />
        <path d="M20 17H4" />
      </svg>
    </button>
  );
}
