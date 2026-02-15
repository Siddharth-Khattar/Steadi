// ABOUTME: Reusable glassmorphic container component that provides frosted-glass
// ABOUTME: styling on top of native OS vibrancy effects.

import type { ReactNode } from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * A frosted-glass container that layers CSS refinement on top of native OS
 * vibrancy (HudWindow on macOS, Acrylic on Windows). The heavy lifting for
 * the blur effect is done by Tauri's EffectsBuilder -- this component adds
 * a subtle white overlay, soft shadow, and edge highlight for depth.
 *
 * Do NOT use heavy `backdrop-filter: blur(Xpx)` here. It only blurs webview
 * content, not the desktop behind the window.
 */
export function GlassPanel({
  children,
  className = "",
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={`rounded-xl bg-white/5 backdrop-blur-sm shadow-lg shadow-black/20 border border-white/10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
