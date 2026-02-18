// ABOUTME: Reusable confirmation dialog component rendered via portal.
// ABOUTME: Replaces window.confirm() which is unreliable in Tauri v2's WKWebView.

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Auto-focus Cancel button when dialog opens (prevents accidental deletion)
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Dismiss on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      onMouseDown={(e) => {
        // Dismiss on backdrop click (only direct clicks on the backdrop)
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative rounded-lg bg-neutral-900 border border-white/15 shadow-xl px-5 py-4 max-w-sm w-full mx-4">
        <p className="text-sm text-white/80 mb-4">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-white/60 rounded-md hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs text-red-400 bg-red-500/20 rounded-md hover:bg-red-500/30 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
