// ABOUTME: Invisible edge/corner zones for overlay resize and a top drag strip.
// ABOUTME: Uses custom center-anchored symmetric resize via pointer tracking and Tauri window APIs.

import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";

/** Resize direction label for mapping drag axes. */
type ResizeDirection =
  | "East"
  | "West"
  | "North"
  | "South"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

/** Which logical axes a resize direction affects. */
interface ResizeAxes {
  /** -1 = West (drag-left grows), 0 = none, 1 = East (drag-right grows) */
  horizontal: -1 | 0 | 1;
  /** -1 = North (drag-up grows), 0 = none, 1 = South (drag-down grows) */
  vertical: -1 | 0 | 1;
}

const DIRECTION_AXES: Record<ResizeDirection, ResizeAxes> = {
  East: { horizontal: 1, vertical: 0 },
  West: { horizontal: -1, vertical: 0 },
  North: { horizontal: 0, vertical: -1 },
  South: { horizontal: 0, vertical: 1 },
  NorthEast: { horizontal: 1, vertical: -1 },
  NorthWest: { horizontal: -1, vertical: -1 },
  SouthEast: { horizontal: 1, vertical: 1 },
  SouthWest: { horizontal: -1, vertical: 1 },
};

/** Width/height of the invisible resize hit zones in pixels. */
const EDGE_SIZE = 6;

/** Height of the top drag strip in pixels. */
const DRAG_STRIP_HEIGHT = 20;

/** Minimum logical window dimensions during resize. */
const MIN_WIDTH = 200;
const MIN_HEIGHT = 100;

/**
 * Initiates a symmetric (center-anchored) resize operation. Instead of Tauri's
 * native `startResizeDragging` which anchors the opposite edge, this tracks
 * pointer movement and applies equal growth/shrink on both sides of the center.
 *
 * Uses `setPointerCapture` to continue receiving events even when the pointer
 * moves outside the element during a fast drag.
 */
function startSymmetricResize(
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

  // Capture initial window state then attach move/up listeners
  void (async () => {
    const [physPos, physSize, scale] = await Promise.all([
      appWindow.outerPosition(),
      appWindow.innerSize(),
      appWindow.scaleFactor(),
    ]);

    // Convert physical pixels → logical pixels (matches e.screenX/Y space)
    const initW = physSize.width / scale;
    const initH = physSize.height / scale;
    const initX = physPos.x / scale;
    const initY = physPos.y / scale;
    const centerX = initX + initW / 2;
    const centerY = initY + initH / 2;

    function handleMove(moveEvent: PointerEvent) {
      const dx = moveEvent.screenX - startScreenX;
      const dy = moveEvent.screenY - startScreenY;

      // Compute effective delta: direction sign ensures dragging "outward"
      // from any edge increases the dimension.
      const hDelta = axes.horizontal !== 0 ? dx * axes.horizontal : 0;
      const vDelta = axes.vertical !== 0 ? dy * axes.vertical : 0;

      // Symmetric: each pixel of outward drag adds 2px to the dimension
      const newW = axes.horizontal !== 0
        ? Math.max(MIN_WIDTH, initW + hDelta * 2)
        : initW;
      const newH = axes.vertical !== 0
        ? Math.max(MIN_HEIGHT, initH + vDelta * 2)
        : initH;

      const newX = centerX - newW / 2;
      const newY = centerY - newH / 2;

      // Fire-and-forget for responsiveness — Tauri fires onMoved/onResized
      // events which useOverlayGeometry picks up for persistence.
      void appWindow.setSize(
        new LogicalSize(Math.round(newW), Math.round(newH)),
      );
      void appWindow.setPosition(
        new LogicalPosition(Math.round(newX), Math.round(newY)),
      );
    }

    function handleUp() {
      el.releasePointerCapture(pointerId);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
    }

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
  })();
}

/**
 * Renders invisible resize handles along all edges and corners of the overlay
 * window, plus a thin drag strip at the top edge for window repositioning.
 *
 * Must be rendered as an absolutely-positioned overlay covering the full window
 * so all hit zones are accessible. Uses pointer-events-none on the container
 * and pointer-events-auto on the active zones to avoid blocking content interaction.
 */
export function WindowControls() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Drag strip at top */}
      <div
        data-tauri-drag-region
        className="absolute top-0 left-0 right-0 pointer-events-auto cursor-grab"
        style={{
          height: DRAG_STRIP_HEIGHT,
          // Inset from edges so corners are still accessible for resize
          left: EDGE_SIZE,
          right: EDGE_SIZE,
        }}
      />

      {/* Edge zones */}
      <ResizeEdge direction="North" className="top-0 left-0 right-0" style={{ height: EDGE_SIZE, cursor: "ns-resize" }} />
      <ResizeEdge direction="South" className="bottom-0 left-0 right-0" style={{ height: EDGE_SIZE, cursor: "ns-resize" }} />
      <ResizeEdge direction="West" className="top-0 bottom-0 left-0" style={{ width: EDGE_SIZE, cursor: "ew-resize" }} />
      <ResizeEdge direction="East" className="top-0 bottom-0 right-0" style={{ width: EDGE_SIZE, cursor: "ew-resize" }} />

      {/* Corner zones */}
      <ResizeEdge direction="NorthWest" className="top-0 left-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nwse-resize" }} />
      <ResizeEdge direction="NorthEast" className="top-0 right-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nesw-resize" }} />
      <ResizeEdge direction="SouthWest" className="bottom-0 left-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nesw-resize" }} />
      <ResizeEdge direction="SouthEast" className="bottom-0 right-0" style={{ width: EDGE_SIZE * 2, height: EDGE_SIZE * 2, cursor: "nwse-resize" }} />
    </div>
  );
}

/**
 * An invisible absolutely-positioned zone that initiates a symmetric
 * center-anchored resize in the given direction on pointerdown.
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
      onPointerDown={(e) => startSymmetricResize(e, direction)}
    />
  );
}
