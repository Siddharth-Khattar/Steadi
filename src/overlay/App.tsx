// ABOUTME: Overlay window teleprompter display. Shows static demo script text
// ABOUTME: on the native glassmorphic background.

/**
 * The overlay body is transparent (set in index.html and globals.css). The
 * native vibrancy effect (HudWindow on macOS, Acrylic on Windows) provides
 * the frosted dark glass. This component only renders text -- no GlassPanel
 * import needed since the frosted glass comes from the OS, not CSS.
 */
export default function OverlayApp() {
  return (
    <div className="w-full h-full flex items-start justify-center p-5">
      <div className="max-w-[90%] text-center">
        <p className="text-white/95 text-lg font-medium leading-relaxed drop-shadow-sm">
          Good morning everyone, and welcome to this quarter's business review.
          I want to start by thanking each of you for the incredible work
          over the past three months. Our team shipped two major product
          launches, grew active users by thirty-two percent, and maintained
          a customer satisfaction score above ninety-five.
        </p>
        <p className="text-white/95 text-lg font-medium leading-relaxed drop-shadow-sm mt-4">
          Today I'll walk you through the key metrics, highlight the wins
          that got us here, and outline our roadmap for the next quarter.
          We have some ambitious targets ahead, but I'm confident this team
          has the momentum and the talent to hit every one of them.
        </p>
        <p className="text-white/95 text-lg font-medium leading-relaxed drop-shadow-sm mt-4">
          Let's start with revenue. We closed the quarter at four point
          seven million in ARR, up eighteen percent from last quarter.
          Enterprise deals accounted for sixty percent of new bookings,
          which is exactly the mix we were targeting.
        </p>
      </div>
    </div>
  );
}
