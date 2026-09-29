import { Citation } from "./types";

/**
 * Deduplicates citations by chunk_id while preserving stable 1-indexed citation order.
 */
export function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const unique: Citation[] = [];

  for (const c of citations) {
    if (!seen.has(c.chunk_id)) {
      seen.add(c.chunk_id);
      unique.push(c);
    }
  }

  return unique;
}

/**
 * Parses markdown/plain text to extract text segments and footnote markers [1], [2], etc.
 */
export interface TextSegment {
  type: "text" | "footnote";
  value: string;
  footnoteId?: number;
}

export function parseFootnotes(content: string): TextSegment[] {
  const regex = /\[(\d+)\]/g;
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "footnote",
      value: match[0],
      footnoteId: parseInt(match[1], 10),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return segments;
}
