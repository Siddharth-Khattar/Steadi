// ABOUTME: Overlay window teleprompter display with dark compact design.
// ABOUTME: Solid black background, positioned below menu bar, bottom-rounded corners.

/**
 * The overlay window is transparent (set in index.html). The dark background
 * comes from CSS. Bottom corners are rounded; top edge aligns with the
 * window's position (below menu bar on macOS).
 *
 * Note: Notch-blending (placing the window IN the menu bar area) requires
 * NSWindow.level = .statusBar or higher — deferred to a future iteration.
 * For now the overlay sits just below the menu bar as a compact dark panel.
 */
export default function OverlayApp() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Teleprompter text content */}
      <div className="flex-1 flex items-start justify-center px-5 py-3 overflow-hidden">
        <div className="max-w-[90%] text-center">
          <p className="text-white/90 text-lg font-medium leading-relaxed">
            Good morning everyone, and welcome to this quarter's business review.
            I want to start by thanking each of you for the incredible work
            over the past three months. Our team shipped two major product
            launches, grew active users by thirty-two percent, and maintained
            a customer satisfaction score above ninety-five.
          </p>
          <p className="text-white/90 text-lg font-medium leading-relaxed mt-3">
            Today I'll walk you through the key metrics, highlight the wins
            that got us here, and outline our roadmap for the next quarter.
            We have some ambitious targets ahead, but I'm confident this team
            has the momentum and the talent to hit every one of them.
          </p>
        </div>
      </div>
    </div>
  );
}
