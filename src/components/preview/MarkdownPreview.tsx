// ABOUTME: Rendered markdown preview panel for teleprompter scripts.
// ABOUTME: Reads activeContent from scriptStore and renders via react-markdown with remark-gfm.

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useScriptStore } from "../../stores/scriptStore";

/**
 * Markdown element styles applied via react-markdown components prop.
 * Uses Tailwind classes directly to avoid dependency on @tailwindcss/typography.
 */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white/90 mt-6 mb-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-white/90 mt-5 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-white/85 mt-4 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-white/80 leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white/90">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-white/75">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-white/80 mb-3 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-white/80 mb-3 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-white/80">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-white/20 pl-4 my-3 text-white/60 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    // Fenced code blocks get a className like "language-js"
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code className="block bg-white/5 rounded-md p-3 text-sm font-mono text-white/80 overflow-x-auto my-3">
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono text-white/85">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-3">{children}</pre>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-blue-400/80 hover:text-blue-300 underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

/**
 * Rendered markdown preview panel. Reads the active script content from
 * the store and renders it as styled HTML via react-markdown.
 */
export function MarkdownPreview() {
  const activeContent = useScriptStore((s) => s.activeContent);

  if (!activeContent) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-white/30 text-sm">Preview will appear here</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-auto bg-white/3 px-6 py-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {activeContent}
      </ReactMarkdown>
    </div>
  );
}
