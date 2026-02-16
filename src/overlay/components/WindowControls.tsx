// ABOUTME: Invisible edge/corner zones for overlay resize.
// ABOUTME: Uses top-anchored vertical resize and center-anchored horizontal resize via pointer tracking and Tauri window APIs.

import {
  getCurrentWindow,
  currentMonitor,
  primaryMonitor,
} from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";

/** Resize direction label for mapping drag axes. */
type ResizeDirection =
  | "East"
  | "West"
  | "South"
  | "SouthEast"
  | "SouthWest";

/** Which logical axes a resize direction affects. */
interface ResizeAxes {
  /** -1 = West (drag-left grows), 0 = none, 1 = East (drag-right grows) */
  horizontal: -1 | 0 | 1;
  /** 1 = South (drag-down grows), 0 = none */
  vertical: 0 | 1;
}

const DIRECTION_AXES: Record<ResizeDirection, ResizeAxes> = {
  East: { horizontal: 1, vertical: 0 },
  West: { horizontal: -1, vertical: 0 },
  South: { horizontal: 0, vertical: 1 },
  SouthEast: { horizontal: 1, vertical: 1 },
  SouthWest: { horizontal: -1, vertical: 1 },
};

/** Width/height of the invisible resize hit zones in pixels. */
const EDGE_SIZE = 6;

/** Minimum logical window dimensions during resize. */
const MIN_WIDTH = 200;
const MIN_HEIGHT = 100;

/**
 * Initiates a resize operation. Horizontal axes use center-anchored symmetric
 * resize; vertical axis is top-anchored (top edge stays fixed, bottom grows).
 *
 * On release, snaps the window to top-center of the current monitor to
 * maintain consistent horizontal alignment.
 *
 * Listeners are registered synchronously to avoid missing pointer events
 * during the async window-state fetch. A guard flag ensures move handlers
 * are no-ops until initialization completes.
 */
function startResize(
  e: React.PointerEvent,
  direction: ResizeDirection,
) {
  e.preventDefault();
  const el = e.currentTarget as HTMLElement;
  const pointerId = e.pointerId;
  el.setPointerCapture(pointerId);

  const startScreenX = e.screenX;
  const startScreenY = e.screenY;
  const axes = DIRECTION_AXES[direction];
  const appWindow = getCurrentWindow();

  // Mutable state populated by the async init; guarded by `initialized`
  let initialized = false;
  let initW = 0;
  let initH = 0;
  let initY = 0;
  /** Monitor horizontal center — resize anchors to this so the overlay
   *  stays centered on the screen during and after horizontal resize. */
  let monitorCenterX = 0;

  function handleMove(moveEvent: PointerEvent) {
    if (!initialized) return;

    const dx = moveEvent.screenX - startScreenX;
    const dy = moveEvent.screenY - startScreenY;

    // Compute effective delta: direction sign ensures dragging "outward"
    // from any edge increases the dimension.
    const hDelta = axes.horizontal !== 0 ? dx * axes.horizontal : 0;
    const vDelta = axes.vertical !== 0 ? dy * axes.vertical : 0;

    // Horizontal: symmetric — each pixel of outward drag adds 2px to width
    const newW = axes.horizontal !== 0
      ? Math.max(MIN_WIDTH, initW + hDelta * 2)
      : initW;
    // Vertical: top-anchored — each pixel of downward drag adds 1px to height
    const newH = axes.vertical !== 0
      ? Math.max(MIN_HEIGHT, initH + vDelta)
      : initH;

    // Horizontal position: anchored to monitor center (not window center)
    // so the overlay stays centered on the screen during resize.
    const newX = monitorCenterX - newW / 2;
    // Vertical position: keep top edge fixed
    const newY = initY;

    // Fire-and-forget for responsiveness — Tauri fires onMoved/onResized
    // events which useOverlayGeometry picks up for persistence.
    void appWindow.setSize(
      new LogicalSize(Math.round(newW), Math.round(newH)),
    );
    void appWindow.setPosition(
      new LogicalPosition(Math.round(newX), Math.round(newY)),
    );
  }

  function cleanup() {
    el.releasePointerCapture(pointerId);
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerup", cleanup);
    el.removeEventListener("pointercancel", cleanup);
    // Re-centering is handled by the debounced snap in useOverlayGeometry's
    // onResized listener — pointer events are unreliable during active resize.
  }

  // Register listeners synchronously so no events are lost during async init
  el.addEventListener("pointermove", handleMove);
  el.addEventListener("pointerup", cleanup);
  el.addEventListener("pointercancel", cleanup);

  // Fetch initial window state and monitor geometry asynchronously
  void (async () => {
    const monitor =
      (await currentMonitor()) ?? (await primaryMonitor());

    const [physSize, scale] = await Promise.all([
      appWindow.innerSize(),
      appWindow.scaleFactor(),
    ]);

    // Convert physical pixels → logical pixels (matches e.screenX/Y space)
    initW = physSize.width / scale;
    initH = physSize.height / scale;

    if (monitor) {
      const monScale = monitor.scaleFactor;
      const monX = monitor.position.x / monScale;
      const monY = monitor.position.y / monScale;
      const monW = monitor.size.width / monScale;
      monitorCenterX = monX + monW / 2;
      initY = monY;
    } else {
      // Fallback: use the window's own center
      const physPos = await appWindow.outerPosition();
      const initX = physPos.x / scale;
      initY = physPos.y / scale;
      monitorCenterX = initX + initW / 2;
    }

    initialized = true;
  })();
}

/**
 * Renders invisible resize handles along the bottom edge, side edges, and
 * bottom corners of the overlay window.
 *
 * Resizing snaps to top-center after completion.
 *
 * Must be rendered as an absolutely-positioned overlay covering the full window
 * so all hit zones are accessible. Uses pointer-events-none on the container
 * and pointer-events-auto on the active zones to avoid blocking content interaction.
 */
export function WindowControls() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Edge zones */}
      <ResizeEdge direction="South" className="bottom-0 left-0 right-0" style={{ height: EDGE_SIZE, cursor: "ns-resize" }} />
      <ResizeEdge direction="West" className="top-0 bottom-0 left-0" style={{ width: EDGE_SIZE, cursor: "ew-resize" }} />
      <ResizeEdge direction="East" className="top-0 bottom-0 right-0" style={{ width: EDGE_SIZE, cursor: "ew-resize" }} />

      {/* Corner zones */}
      <ResizeEdge direction="SouthWest" className="bottom-0 left-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nesw-resize" }} />
      <ResizeEdge direction="SouthEast" className="bottom-0 right-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nwse-resize" }} />
    </div>
  );
}

/**
 * An invisible absolutely-positioned zone that initiates a resize in the
 * given direction on pointerdown.
 */
function ResizeEdge({
  direction,
  className,
  style,
}: {
  direction: ResizeDirection;
  className: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute pointer-events-auto ${className}`}
      style={style}
      onPointerDown={(e) => startResize(e, direction)}
    />
  );
}
