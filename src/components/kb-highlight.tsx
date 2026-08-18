/**
 * React renderers that wrap matched tokens in <mark> elements.
 *
 * - `highlightText`  — used inside the article body. Tags the first match
 *   across the render pass with `id="kb-first-match"` so the page can
 *   auto-scroll to it.
 * - `highlightInline` — used in sidebar titles/snippets; no first-match
 *   anchor (that belongs to the article body only).
 *
 * Both accept a pre-tokenized term list so behavior stays in sync with the
 * search filter in `src/lib/kb-search.ts`.
 */
import React from "react";
import { findStemMatches } from "@/lib/kb-search";

const MARK_CLASS = "rounded-sm bg-accent-2/30 px-0.5 text-foreground";

/**
 * Wraps stem-matched spans in <mark>. Pairs with `buildSnippet` in
 * `kb-search.ts` — when the snippet builder runs in sparse mode it centers
 * the single match within the returned context window, so the <mark>
 * produced here lands at the visual middle of the snippet. Dense windows
 * may contain multiple marks; rendering order matches text order.
 */
function renderWithMarks(
  text: string,
  stems: string[],
  options: { firstAnchor: boolean; counter?: { n: number }; keyPrefix: string },
): React.ReactNode {
  const matches = findStemMatches(text, stems);
  if (matches.length === 0) return text;
  // Walk matches in order, splicing the original substring (so inflected
  // forms like `running` are wrapped, not the stem `run`).
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const { start, length } of matches) {
    if (start < last) continue; // overlapping; skip
    if (start > last) parts.push(text.slice(last, start));
    const isFirst = options.firstAnchor && options.counter?.n === 0;
    if (options.counter) options.counter.n += 1;
    parts.push(
      <mark
        key={`${options.keyPrefix}-${key++}`}
        {...(isFirst ? { id: "kb-first-match" } : {})}
        className={MARK_CLASS}
      >
        {text.slice(start, start + length)}
      </mark>,
    );
    last = start + length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function highlightText(
  text: string,
  stems: string[],
  counter: { n: number },
): React.ReactNode {
  return renderWithMarks(text, stems, {
    firstAnchor: true,
    counter,
    keyPrefix: "m",
  });
}

export function highlightInline(text: string, stems: string[]): React.ReactNode {
  return renderWithMarks(text, stems, {
    firstAnchor: false,
    keyPrefix: "s",
  });
}
