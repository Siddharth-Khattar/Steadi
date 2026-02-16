// ABOUTME: Scrolling markdown container for the teleprompter overlay.
// ABOUTME: Renders script content via react-markdown with overlay-optimized styles, top-edge fade, and hidden scrollbar.

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTeleprompterStore } from "../../stores/teleprompterStore";

interface TeleprompterViewProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Markdown element styles tuned for the teleprompter overlay context.
 * Brighter whites for emphasis elements, relaxed leading for readability
 * while scrolling.
 */
const overlayMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-[1.4em] font-bold text-white/95 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[1.2em] font-bold text-white/90 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[1.1em] font-semibold text-white/85 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-white/80 italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
};

/**
 * Main scrolling content area for the teleprompter. Renders scriptContent
 * from the store as styled markdown. The container ref is passed in for
 * the scroll engine to drive scrollTop directly.
 *
 * Visual effects:
 * - CSS mask-image fade at the top edge (via .teleprompter-fade class)
 * - Hidden scrollbar (via .teleprompter-scroll class)
 */
export function TeleprompterView({ containerRef }: TeleprompterViewProps) {
  const scriptContent = useTeleprompterStore((s) => s.scriptContent);
  const fontSize = useTeleprompterStore((s) => s.fontSize);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-8 py-6 teleprompter-fade teleprompter-scroll text-white/75"
      style={{ fontSize: `${fontSize}px` }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={overlayMarkdownComponents}
      >
        {scriptContent}
      </ReactMarkdown>
    </div>
  );
}
