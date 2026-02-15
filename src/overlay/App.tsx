// ABOUTME: Overlay window teleprompter display with dark notch-blending design.
// ABOUTME: Solid black background blends with MacBook notch, content below notch area.

/**
 * The overlay window is transparent (set in index.html). The dark background
 * comes from CSS, not native vibrancy. This creates a solid black look that
 * blends with the MacBook notch. Bottom corners are rounded; top edge is flush
 * with the screen edge.
 *
 * Layout:
 * ┌──────────┬───────┬──────────┐  ← top of screen (flush)
 * │  (space) │ NOTCH │  (space) │  ← notch row: behind physical notch is hidden
 * ├──────────┴───────┴──────────┤
 * │       teleprompter text     │  ← content starts below notch height
 * └─────────────────────────────┘  ← rounded bottom corners
 *
 * On Windows (no notch), the spacer is smaller and the overlay sits flush
 * at the top edge as a dark rectangle.
 */
export default function OverlayApp() {
  return (
    <div className="w-full h-full flex flex-col rounded-b-2xl overflow-hidden bg-black/95">
      {/* Notch-area spacer: ~37pt on notch Macs, content is hidden behind notch anyway */}
      <div className="h-9.5 shrink-0" />

      {/* Teleprompter text content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-4 overflow-hidden">
        <div className="max-w-[85%] text-center">
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
