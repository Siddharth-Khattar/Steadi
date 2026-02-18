// ABOUTME: Dialog shown on the overlay when Esc stops a teleprompter session.
// ABOUTME: Asks whether to also close (hide) the overlay, with a "don't ask again" preference.

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface EscActionDialogProps {
  open: boolean;
  onClose: (action: "close" | "keep-open") => void;
}

/**
 * Modal dialog rendered inside the overlay window that appears after the user
 * presses Escape to stop the teleprompter.
 *
 * It asks whether the overlay window itself should be hidden. The user can
 * optionally check "Don't ask again" to persist their preference, after which
 * future Esc presses will skip this dialog entirely.
 *
 * Auto-focuses the "Keep Open" button so a stray Enter/Space keypress does
 * not accidentally close the overlay.
 *
 * Rendered via a portal to `document.body` to guarantee it layers above all
 * other overlay content regardless of stacking contexts.
 */
export function EscActionDialog({ open, onClose }: EscActionDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false);
  const keepOpenRef = useRef<HTMLButtonElement>(null);

  // Reset the checkbox each time the dialog is opened so it doesn't carry
  // over a stale checked state from a previous session.
  useEffect(() => {
    if (open) {
      setRememberChoice(false);
      keepOpenRef.current?.focus();
    }
  }, [open]);

  const commit = useCallback(
    (action: "close" | "keep-open") => {
      if (rememberChoice) {
        useTeleprompterStore.getState().setEscOverlayAction(action);
      }
      onClose(action);
    },
    [rememberChoice, onClose],
  );

  // Dismiss (keep open, no preference saved) on Escape. Must stop propagation
  // to prevent the overlay's global Esc handler from re-triggering.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose("keep-open");
      }
    }

    // Use capture phase to intercept before the overlay's bubble-phase listener.
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-center justify-center"
      onMouseDown={(e) => {
        // Backdrop click → keep open without saving preference
        if (e.target === e.currentTarget) {
          onClose("keep-open");
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Dialog panel */}
      <div className="relative rounded-xl bg-neutral-900 border border-white/15 shadow-2xl px-5 py-5 w-70">
        <h2 className="text-sm font-semibold text-white/90 mb-1">
          Close overlay?
        </h2>
        <p className="text-xs text-white/55 mb-4 leading-relaxed">
          The teleprompter has stopped. Do you also want to hide the overlay
          window?
        </p>

        {/* Don't ask again */}
        <label className="flex items-center gap-2 mb-5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-white/70 cursor-pointer"
          />
          <span className="text-xs text-white/45 group-hover:text-white/60 transition-colors">
            Don't ask again
          </span>
        </label>

        <div className="flex gap-2">
          <button
            ref={keepOpenRef}
            type="button"
            onClick={() => commit("keep-open")}
            className="flex-1 px-3 py-1.5 text-xs text-white/70 rounded-lg bg-white/8 hover:bg-white/14 border border-white/10 transition-colors"
          >
            Keep Open
          </button>
          <button
            type="button"
            onClick={() => commit("close")}
            className="flex-1 px-3 py-1.5 text-xs text-white/90 rounded-lg bg-white/15 hover:bg-white/22 border border-white/15 transition-colors"
          >
            Close Overlay
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
