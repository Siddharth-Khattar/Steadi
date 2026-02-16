// ABOUTME: Extracts title and preview text from markdown content for sidebar display.
// ABOUTME: Shared markdown stripping utility and metadata extraction used across the UI.

export interface MarkdownMeta {
  title: string;
  preview: string;
}

/**
 * Strip all markdown syntax from text to produce plain text suitable for
 * UI previews. Handles headings, inline formatting, links, images, lists,
 * and blockquotes.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/__(.+?)__/g, "$1") // bold (underscore)
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/_(.+?)_/g, "$1") // italic (underscore)
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "") // images
    .replace(/^[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/^>\s+/gm, "") // blockquotes
    .trim();
}

const PREVIEW_MAX_LENGTH = 100;

/**
 * Extract title and preview from markdown content.
 *
 * - Title: text of the first `# heading` line, or "Untitled" if none found.
 * - Preview: first non-empty, non-heading line with inline markdown stripped,
 *   truncated to 100 characters.
 */
export function extractMarkdownMeta(content: string): MarkdownMeta {
  const lines = content.split("\n");

  let title = "Untitled";
  let preview = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    // Match ATX-style heading (# Heading)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch && title === "Untitled") {
      // Use the first heading as title
      title = stripMarkdown(headingMatch[2]);
      continue;
    }

    // Skip any subsequent headings when looking for preview text
    if (headingMatch) continue;

    // First non-empty, non-heading line becomes the preview
    if (preview === "") {
      const stripped = stripMarkdown(trimmed);
      preview =
        stripped.length > PREVIEW_MAX_LENGTH
          ? stripped.slice(0, PREVIEW_MAX_LENGTH) + "…"
          : stripped;
    }

    // Stop once we have both
    if (title !== "Untitled" && preview !== "") break;
  }

  return { title, preview };
}
