/**
 * Pure (non-React) search helpers for the knowledge base.
 *
 * Owns:
 *   - Query tokenization + regex construction
 *   - Building the flat, fuzzy-searchable record set from sidebar/article data
 *   - Snippet + literal-hit counting used by sidebar results
 *   - A Fuse instance factory with the canonical weights/threshold
 *
 * React-specific pieces (highlight renderers, the live hook) live in
 * `src/components/kb-highlight.tsx` and `src/hooks/use-kb-search.ts`.
 */
import Fuse from "fuse.js";
import { sidebarCategories } from "@/content/categories";
import { pageContents } from "@/content/articles";
import { documents, type DocRef } from "@/content/documents";
import { images, type ImageRef } from "@/content/images";
import { videos } from "@/content/videos";
import { slideshows, type Slideshow } from "@/content/slideshows";
import type { PageContent } from "@/content/types";

export interface SearchableRecord {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  tags: string;
  content: string;
  docNames: string;
  imageAlts: string;
  videoNames: string;
  slideshowMetadata: string;
  // Stemmed copies of each text field — Fuse searches these so different
  // word forms (run/running/ran-ish) collapse onto the same stems used in
  // tokenized queries.
  titleStems: string;
  categoryStems: string;
  tagStems: string;
  contentStems: string;
  docStems: string;
  imageStems: string;
  videoStems: string;
  slideshowStems: string;
}

export interface SearchCorpusCategory {
  id: string;
  name: string;
  subPages: Array<{ id: string; title: string }>;
}

export interface SearchCorpus {
  categories: SearchCorpusCategory[];
  pages: Record<string, PageContent>;
  documents: Record<string, DocRef>;
  images: Record<string, ImageRef>;
  videos: Record<string, string>;
  slideshows: Record<string, Slideshow>;
}

export function getDefaultSearchCorpus(): SearchCorpus {
  return {
    categories: sidebarCategories,
    pages: pageContents,
    documents: documents as Record<string, DocRef>,
    images: images as Record<string, ImageRef>,
    videos: videos as Record<string, string>,
    slideshows: slideshows as Record<string, Slideshow>,
  };
}

/**
 * Common short English words ignored during tokenization so a query like
 * "the validation schedule" focuses on `validation` + `schedule`. Kept
 * intentionally small — over-pruning hurts recall more than precision.
 */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "else",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "them",
  "us",
  "our",
  "your",
  "their",
  "my",
  "me",
  "do",
  "does",
  "did",
  "so",
  "not",
  "no",
  "yes",
  "can",
  "will",
  "would",
  "should",
  "could",
  "may",
  "might",
  "how",
  "what",
  "where",
  "when",
  "why",
  "who",
  "please",
  "need",
  "want",
  "have",
  "has",
  "had",
  "than",
  "too",
  "very",
  "just",
  "about",
  "into",
  "over",
  "under",
  "up",
  "down",
  "out",
]);

/**
 * Lightweight English stemmer. Not a full Porter implementation — strips
 * common inflectional/derivational suffixes and collapses doubled
 * consonants (`running` → `runn` → `run`) so different word forms map to
 * the same stem. Order of rules matters: longer/more-specific first.
 *
 * Conservative by design: short words and stems below 3 chars are left
 * alone to avoid noisy collisions.
 */
function rawStem(word: string): string {
  if (word.length < 4) return word;
  const rules: Array<[RegExp, string]> = [
    [/izations?$/, ""],
    [/ization$/, "ize"],
    [/iveness$/, "ive"],
    [/fulness$/, "ful"],
    [/ousness$/, "ous"],
    [/ations?$/, ""],
    [/ational$/, "ate"],
    [/tional$/, "tion"],
    [/ments?$/, ""],
    [/ness$/, ""],
    [/ingly$/, ""],
    [/edly$/, ""],
    [/ating$/, ""],
    [/ated$/, ""],
    [/ate$/, ""],
    [/ies$/, "y"],
    [/sses$/, "ss"],
    [/ied$/, "y"],
    [/ying$/, "y"],
    [/ing$/, ""],
    [/edly$/, ""],
    [/ed$/, ""],
    [/est$/, ""],
    [/er$/, ""],
    [/ly$/, ""],
    [/es$/, ""],
    [/s$/, ""],
  ];
  let next = word;
  for (const [re, rep] of rules) {
    if (re.test(next)) {
      const candidate = next.replace(re, rep);
      if (candidate.length >= 3) {
        next = candidate;
        break;
      }
    }
  }
  // Collapse a trailing doubled consonant (running → runn → run).
  if (next.length >= 4 && /([bcdfghjklmnpqrstvwxz])\1$/.test(next)) {
    next = next.slice(0, -1);
  }
  return next;
}

export function stem(word: string): string {
  const w = word.toLowerCase();
  const s = rawStem(w);
  return s.length >= 2 ? s : w;
}

// Matches a single "word" — a letter/digit run that may contain inner
// apostrophes or hyphens. The Unicode flag (`u`) keeps this correct for
// accented characters; the leading anchor ensures we never start a word on
// punctuation, and the trailing punctuation is trimmed below so a word at
// the end of a sentence ("schedules.") doesn't grab the period and skew
// snippet centering.
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;

/**
 * Trim leading/trailing apostrophes and hyphens from a regex match span.
 * Returns the cleaned word plus its adjusted offset/length so callers can
 * report a match span that stops at the true word boundary, not at
 * adjacent punctuation. Returns null when nothing remains.
 */
function trimWordSpan(
  raw: string,
  start: number,
): { word: string; start: number; length: number } | null {
  let s = 0;
  let e = raw.length;
  while (s < e && (raw[s] === "'" || raw[s] === "-")) s += 1;
  while (e > s && (raw[e - 1] === "'" || raw[e - 1] === "-")) e -= 1;
  if (e <= s) return null;
  return { word: raw.slice(s, e), start: start + s, length: e - s };
}

/** Stem every word in `text`, preserving non-word characters as spaces. */
export function stemmedText(text: string): string {
  if (!text) return "";
  return text.replace(WORD_RE, (w) => {
    const trimmed = w.replace(/^['-]+|['-]+$/g, "");
    return trimmed ? stem(trimmed) : w;
  });
}

export interface StemMatch {
  start: number;
  length: number;
}

/**
 * Walk `text` word-by-word and return spans whose stem (or any hyphen-part
 * stem) is in `stems`. Used by highlighters, snippet builder, and the
 * sidebar match counter so all three agree on what counts as a "match".
 */
export function findStemMatches(text: string, stems: string[]): StemMatch[] {
  if (!text || stems.length === 0) return [];
  const set = new Set(stems);
  const out: StemMatch[] = [];
  WORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(text)) !== null) {
    const trimmed = trimWordSpan(m[0], m.index);
    if (!trimmed) continue;
    const lower = trimmed.word.toLowerCase();
    if (set.has(stem(lower))) {
      out.push({ start: trimmed.start, length: trimmed.length });
      continue;
    }
    if (lower.includes("-")) {
      // Mark each hyphen-part whose stem matches (e.g. `user-roles` hit on
      // the `roles` half when the query stem is `role`). Offsets are
      // computed from the trimmed span so a leading hyphen never shifts
      // the reported start position.
      let offset = 0;
      for (const part of lower.split("-")) {
        if (part && set.has(stem(part))) {
          out.push({ start: trimmed.start + offset, length: part.length });
        }
        offset += part.length + 1; // +1 for the hyphen itself
      }
    }
  }
  return out;
}

/**
 * Tokenize a free-form query into distinct lowercase terms.
 *
 * - Lowercases input.
 * - Splits on whitespace AND punctuation (commas, periods, slashes, quotes,
 *   parentheses, etc.) so `"user-roles, permissions."` → `user-roles`,
 *   `permissions`.
 * - Preserves hyphenated terms as a whole (`user-roles`) AND emits each
 *   non-trivial part (`user`, `roles`) so queries match either form.
 * - Strips leading/trailing apostrophes and stray hyphens.
 * - Drops stopwords and any term shorter than 2 characters.
 * - Stems each surviving term so `running` / `runs` / `ran-ish` and
 *   `run` all collapse onto the same query token.
 * - Deduplicates the final set.
 */
export function tokenize(query: string): string[] {
  const seen = new Set<string>();
  const add = (t: string) => {
    const cleaned = t.replace(/^[-']+|[-']+$/g, "");
    if (cleaned.length < 2) return;
    if (STOPWORDS.has(cleaned)) return;
    seen.add(stem(cleaned));
  };
  // Split on anything that's not a word char, hyphen, or apostrophe. This
  // keeps `user-roles` and `don't` intact while breaking on punctuation.
  const raw = query.toLowerCase().split(/[^\p{L}\p{N}'-]+/u);
  for (const term of raw) {
    if (!term) continue;
    add(term);
    if (term.includes("-")) {
      // Also emit each segment so `user-roles` matches plain `roles`.
      for (const part of term.split("-")) add(part);
    }
  }
  return Array.from(seen);
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a case-insensitive alternation regex over `tokens`, longest first. */
export function buildHighlightRegex(tokens: string[]): RegExp | null {
  if (tokens.length === 0) return null;
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  return new RegExp(`(${sorted.map(escapeRegex).join("|")})`, "gi");
}

/** Count word-spans in `haystack` whose stem is in `stems`. */
export function countTokenHits(haystack: string, stems: string[]): number {
  return findStemMatches(haystack, stems).length;
}

/**
 * Extract a short snippet around the first literal token occurrence in `raw`.
 * Falls back to a leading preview when only a fuzzy match exists (no literal
 * token in the body).
 */
/**
 * Extract a snippet around the densest cluster of stem matches in `raw`.
 *
 * Strategy:
 *  1. Strip markdown noise (heading markers, list bullets, reference tokens).
 *  2. Find every stem match in the cleaned text.
 *  3. If multiple matches exist, pick the window (≤ `maxWindow` chars) that
 *     covers the most matches — so a query whose terms appear near each
 *     other yields a single context window instead of just the first hit.
 *  4. Pad with `radius` on each side and snap to word boundaries so the
 *     snippet never starts/ends mid-word.
 */
export function buildSnippet(
  raw: string,
  stems: string[],
  {
    radius = 60,
    maxWindow = 180,
    sparseRadius = 40,
    minClusterCount = 2,
  }: {
    radius?: number;
    maxWindow?: number;
    /** Tighter radius used when the best cluster has fewer than `minClusterCount` matches. */
    sparseRadius?: number;
    minClusterCount?: number;
  } = {},
): string | null {
  const cleaned = raw
    .replace(/\[(?:video|image|doc):[\w-]+\]/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "");
  if (stems.length === 0) return null;
  const matches = findStemMatches(cleaned, stems);
  if (matches.length === 0) {
    const head = cleaned.replace(/\s+/g, " ").trim().slice(0, 120);
    return head ? head + (cleaned.length > 120 ? "…" : "") : null;
  }

  // Pick the densest cluster: for each match as left anchor, walk forward
  // while the span stays within `maxWindow`; remember the (count, span) that
  // covers the most matches with the tightest span as tiebreaker.
  let bestStart = matches[0].start;
  let bestEnd = matches[0].start + matches[0].length;
  let bestCount = 1;
  let bestSpan = bestEnd - bestStart;
  for (let i = 0; i < matches.length; i += 1) {
    const left = matches[i].start;
    let j = i;
    while (
      j + 1 < matches.length &&
      matches[j + 1].start + matches[j + 1].length - left <= maxWindow
    ) {
      j += 1;
    }
    const right = matches[j].start + matches[j].length;
    const count = j - i + 1;
    const span = right - left;
    if (count > bestCount || (count === bestCount && span < bestSpan)) {
      bestStart = left;
      bestEnd = right;
      bestCount = count;
      bestSpan = span;
    }
  }

  // When the densest cluster is too sparse (typically a single isolated
  // match), tighten the window AND balance context on both sides so the
  // match lands roughly in the middle of the snippet — `highlightInline`
  // re-scans the returned text for stem matches and wraps them in <mark>,
  // so a centered window produces a centered highlight.
  const sparse = bestCount < minClusterCount;
  const effectiveRadius = sparse ? sparseRadius : radius;

  let start = Math.max(0, bestStart - effectiveRadius);
  let end = Math.min(cleaned.length, bestEnd + effectiveRadius);

  if (sparse) {
    // If one side hit the text bound, extend the other side by the leftover
    // budget so total context length stays close to 2 * sparseRadius and
    // the match stays visually centered after rendering.
    const leftBudget = bestStart - start;
    const rightBudget = end - bestEnd;
    if (leftBudget < effectiveRadius && rightBudget === effectiveRadius) {
      end = Math.min(cleaned.length, end + (effectiveRadius - leftBudget));
    } else if (rightBudget < effectiveRadius && leftBudget === effectiveRadius) {
      start = Math.max(0, start - (effectiveRadius - rightBudget));
    }
  }

  // Snap to whitespace so the snippet never breaks a word in half. Cap the
  // snap distance so centering isn't undone by a far-away space.
  if (start > 0) {
    const ws = cleaned.lastIndexOf(" ", start);
    if (ws !== -1 && start - ws <= 15) start = ws + 1;
  }
  if (end < cleaned.length) {
    const ws = cleaned.indexOf(" ", end);
    if (ws !== -1 && ws - end <= 15) end = ws;
  }

  if (sparse) {
    // Prefer sentence-terminator boundaries when they're close by — they
    // read better than mid-sentence cuts. To keep the match centered,
    // every char we trim off one side gets added back to the opposite
    // side (within text bounds).
    const SENT_RE = /[.!?](?=\s|$)/g;

    // Left side: nearest terminator before `bestStart` within snap range.
    SENT_RE.lastIndex = 0;
    let leftTerm = -1;
    let m: RegExpExecArray | null;
    while ((m = SENT_RE.exec(cleaned)) !== null) {
      if (m.index >= bestStart) break;
      leftTerm = m.index + 1; // position just after the terminator
    }
    if (leftTerm !== -1 && leftTerm > start && leftTerm - start <= 20) {
      const skipped = leftTerm - start;
      start = leftTerm;
      // Skip the following whitespace so the snippet starts on a word.
      while (start < cleaned.length && /\s/.test(cleaned[start])) start += 1;
      // Compensate on the right to preserve visual centering.
      end = Math.min(cleaned.length, end + skipped);
    }

    // Right side: nearest terminator after `bestEnd` within snap range.
    SENT_RE.lastIndex = bestEnd;
    const rightTermMatch = SENT_RE.exec(cleaned);
    if (
      rightTermMatch &&
      rightTermMatch.index + 1 < end &&
      end - (rightTermMatch.index + 1) <= 20
    ) {
      const trimmed = end - (rightTermMatch.index + 1);
      end = rightTermMatch.index + 1; // include the terminator itself
      // Compensate on the left to preserve visual centering.
      start = Math.max(0, start - trimmed);
      // Re-snap leading whitespace so we don't start on a space.
      const ws = cleaned.lastIndexOf(" ", start);
      if (ws !== -1 && start - ws <= 15) start = ws + 1;
    }
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < cleaned.length ? "…" : "";
  return prefix + cleaned.slice(start, end).replace(/\s+/g, " ").trim() + suffix;
}

/**
 * Stable FNV-1a fingerprint of every indexed field. Hashing the actual values
 * catches same-length edits as well as additions, deletions, tag changes, and
 * document/media metadata updates.
 */
export function computeContentSignature(records = buildSearchableRecords()): string {
  const canonical = records
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((record) =>
      [
        record.id,
        record.title,
        record.categoryId,
        record.categoryName,
        record.tags,
        record.content,
        record.docNames,
        record.imageAlts,
        record.videoNames,
        record.slideshowMetadata,
      ].join("\u001f"),
    )
    .join("\u001e");

  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${records.length}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/** Build the flat, fuzzy-searchable record set from the current corpus. */
export function buildSearchableRecords(corpus = getDefaultSearchCorpus()): SearchableRecord[] {
  const categoryById = new Map(corpus.categories.map((category) => [category.id, category]));

  return Object.values(corpus.pages).map((page) => {
    const category = categoryById.get(page.categoryId);
    const sidebarPage = category?.subPages.find((subPage) => subPage.id === page.id);
    const title = page.title || sidebarPage?.title || page.id;
    const categoryName = category?.name ?? "Knowledge base";
    const body = page.content ?? "";
    const tags = (page.tags ?? []).join(" ");
    const docKeys = Array.from(body.matchAll(/\[doc:([\w-]+)\]/g)).map((m) => m[1]);
    const imageKeys = Array.from(body.matchAll(/\[image:([\w-]+)\]/g)).map((m) => m[1]);
    const videoKeys = Array.from(body.matchAll(/\[video:([\w-]+)\]/g)).map((m) => m[1]);
    const slideshowKeys = Array.from(body.matchAll(/\[slideshow:([\w-]+)\]/g)).map(
      (match) => match[1],
    );
    const docNames = docKeys
      .map((k) => {
        const d = corpus.documents[k];
        return d ? [d.name, d.description ?? "", d.kind ?? ""].join(" ") : k;
      })
      .join(" \n ");
    const imageAlts = imageKeys
      .map((k) => {
        const img = corpus.images[k];
        return img ? [img.alt, img.caption ?? ""].join(" ") : k;
      })
      .join(" \n ");
    const videoNames = [
      ...videoKeys.map((key) => `${key} ${corpus.videos[key] ?? ""}`),
      page.video ?? "",
    ]
      .filter(Boolean)
      .join(" \n ");
    const slideshowMetadata = slideshowKeys
      .map((key) => {
        const slideshow = corpus.slideshows[key];
        if (!slideshow) return key;
        return [
          slideshow.title ?? "",
          ...slideshow.steps.flatMap((step) => [
            step.label,
            step.title,
            step.description,
            step.alt,
          ]),
        ].join(" ");
      })
      .join(" \n ");
    return {
      id: page.id,
      title,
      categoryId: page.categoryId,
      categoryName,
      tags,
      content: body,
      docNames,
      imageAlts,
      videoNames,
      slideshowMetadata,
      titleStems: stemmedText(title),
      categoryStems: stemmedText(categoryName),
      tagStems: stemmedText(tags),
      contentStems: stemmedText(body),
      docStems: stemmedText(docNames),
      imageStems: stemmedText(imageAlts),
      videoStems: stemmedText(videoNames),
      slideshowStems: stemmedText(slideshowMetadata),
    };
  });
}

/** Canonical Fuse instance — typo-tolerant, weights title > content > metadata. */
export function createFuse(records: SearchableRecord[]): Fuse<SearchableRecord> {
  return new Fuse(records, {
    keys: [
      // Stemmed fields drive matching so different word forms collapse;
      // raw text fields are kept around for snippet building elsewhere.
      { name: "titleStems", weight: 0.3 },
      { name: "tagStems", weight: 0.22 },
      { name: "categoryStems", weight: 0.12 },
      { name: "contentStems", weight: 0.18 },
      { name: "docStems", weight: 0.06 },
      { name: "imageStems", weight: 0.05 },
      { name: "slideshowStems", weight: 0.04 },
      { name: "videoStems", weight: 0.03 },
    ],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export interface SidebarSubPageResult {
  id: string;
  title: string;
  parentId: string;
  parentArticleId?: string;
  matchCount: number;
  snippet: string | null;
  rank: number;
  literal: number;
}

export interface SidebarCategoryResult {
  id: string;
  name: string;
  icon: import("react").ReactNode;
  subPages: SidebarSubPageResult[];
}

/**
 * Run a search and return filtered sidebar categories. When `query` is empty
 * returns every category/sub-page with zero match metadata so the sidebar can
 * render its idle state from the same shape.
 */
export function searchSidebar(
  query: string,
  tokens: string[],
  fuse: Fuse<SearchableRecord>,
): SidebarCategoryResult[] {
  const q = query.trim();
  if (!q || tokens.length === 0) {
    return sidebarCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      subPages: c.subPages.map((s) => ({
        ...s,
        matchCount: 0,
        snippet: null,
        rank: 0,
        literal: 0,
      })),
    }));
  }

  // Fuse indexes stemmed fields, so query Fuse with the stemmed token set
  // (falls back to raw query if tokenize stripped everything).
  const fuseQuery = tokens.length > 0 ? tokens.join(" ") : q;
  const fuseHits = fuse.search(fuseQuery);
  const ranked = new Map<string, number>();
  fuseHits.forEach((h, i) => ranked.set(h.item.id, i));

  return sidebarCategories
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      subPages: c.subPages
        .map<SidebarSubPageResult | null>((s) => {
          const pc = pageContents[s.id];
          const titleHits = countTokenHits(s.title, tokens);
          const bodyHits = pc ? countTokenHits(pc.content, tokens) : 0;
          const literal = titleHits + bodyHits;
          const fuzzyRank = ranked.get(s.id);
          const isMatch = literal > 0 || fuzzyRank !== undefined;
          if (!isMatch) return null;
          return {
            ...s,
            matchCount: literal > 0 ? literal : 1,
            snippet: pc ? buildSnippet(pc.content, tokens) : null,
            rank: fuzzyRank ?? Number.MAX_SAFE_INTEGER,
            literal,
          };
        })
        .filter((s): s is SidebarSubPageResult => s !== null)
        .sort((a, b) => a.rank - b.rank || b.literal - a.literal),
    }))
    .filter((c) => c.subPages.length > 0);
}
