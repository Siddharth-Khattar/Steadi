// ABOUTME: Invisible edge/corner zones for overlay resize-dragging and a top drag strip.
// ABOUTME: Uses Tauri startResizeDragging API with direction-specific cursors for intuitive window manipulation.

import type { MouseEventHandler } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Tauri resize direction strings matching the internal ResizeDirection type. */
type ResizeDirection =
  | "East"
  | "West"
  | "North"
  | "South"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

/** Width/height of the invisible resize hit zones in pixels. */
const EDGE_SIZE = 6;

/** Height of the top drag strip in pixels. */
const DRAG_STRIP_HEIGHT = 20;

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
 * An invisible absolutely-positioned zone that initiates a Tauri window
 * resize-drag in the given direction on mousedown.
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
  const onMouseDown: MouseEventHandler = (e) => {
    e.preventDefault();
    void getCurrentWindow().startResizeDragging(direction);
  };

  return (
    <div
      className={`absolute pointer-events-auto ${className}`}
      style={style}
      onMouseDown={onMouseDown}
    />
  );
}
