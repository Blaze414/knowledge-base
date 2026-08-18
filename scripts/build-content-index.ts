/**
 * Builds a machine-readable index of the knowledge base content.
 *
 *   bun run index:content
 *
 * Writes `public/content-index.json` with:
 *   - generatedAt         ISO timestamp
 *   - defaultPageId       fallback page id
 *   - categories[]        sidebar tree (id, name, subPages)
 *   - pages[]             every resolved article with deep-link href
 *                         and the tokens it references (doc/image/video).
 *                         Each token also records whether it resolves
 *                         and where it points to.
 *   - registries          flat lists of all known doc/image/video keys
 *   - orphans             articles not listed in any category, and
 *                         category sub-pages without an article file.
 *
 * Also writes `public/search-index.json`, a serialisable snapshot of the
 * same records used by the in-browser ranker. The app builds its in-memory
 * index from imported content (no fetch required); this artifact supports
 * audits and a future Web Worker without creating a second source of truth.
 *
 * The file is checked into /public/ and also served at /content-index.json
 * so debugging tools, link checkers, and future validations can consume
 * the same source of truth.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sidebarCategories } from "../src/content/categories";
import { pageContents, DEFAULT_PAGE_ID } from "../src/content/articles";
import { documents } from "../src/content/documents";
import { images } from "../src/content/images";
import { videos } from "../src/content/videos";
import { callouts } from "../src/content/callouts";
import { buildSearchableRecords, computeContentSignature } from "../src/lib/kb-search";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_PATH = join(PROJECT_ROOT, "public", "content-index.json");
const SEARCH_OUT_PATH = join(PROJECT_ROOT, "public", "search-index.json");

type TokenKind = "doc" | "image" | "video" | "note" | "warn" | "warning";
interface TokenRef {
  kind: TokenKind;
  key: string;
  line: number;
  resolved: boolean;
  target: string | null;
}

// Callouts may include an optional inline override:
//     [note:key]: My custom description
const TOKEN_RE = /^\[(video|image|doc|note|warn|warning):([\w-]+)\](?::\s*(.+))?$/;

function resolveToken(kind: TokenKind, key: string): string | null {
  if (kind === "doc") return (documents as Record<string, { href: string }>)[key]?.href ?? null;
  if (kind === "image") return (images as Record<string, { src: string }>)[key]?.src ?? null;
  if (kind === "video") return (videos as Record<string, string>)[key] ?? null;
  if (kind === "note" || kind === "warn" || kind === "warning") {
    return (callouts as Record<string, { text: string }>)[key]?.text ?? null;
  }
  return null;
}

function deepLink(pageId: string): string {
  // Mirror the URL contract the index route ships with `/?page=<id>`.
  return `/?page=${encodeURIComponent(pageId)}`;
}

const knownIds = new Set<string>();
for (const cat of sidebarCategories) for (const s of cat.subPages) knownIds.add(s.id);

const pages = Object.values(pageContents).map((article) => {
  const tokens: TokenRef[] = [];
  const lines = article.content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(TOKEN_RE);
    if (!m) continue;
    const kind = m[1] as TokenKind;
    const key = m[2];
    const target = resolveToken(kind, key);
    tokens.push({ kind, key, line: i + 1, resolved: target !== null, target });
  }
  return {
    id: article.id,
    title: article.title,
    categoryId: article.categoryId,
    href: deepLink(article.id),
    lastUpdated: article.lastUpdated,
    readTime: article.readTime,
    tags: article.tags ?? [],
    video: article.video ?? null,
    tokens,
  };
});

const categories = sidebarCategories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  subPages: cat.subPages.map((s) => ({
    id: s.id,
    title: s.title,
    parentId: s.parentId,
    href: deepLink(s.id),
    hasArticle: Boolean(pageContents[s.id]),
  })),
}));

const orphans = {
  articlesWithoutCategory: Object.keys(pageContents).filter((id) => !knownIds.has(id)),
  subPagesWithoutArticle: [...knownIds].filter((id) => !pageContents[id]),
};

const registries = {
  documents: Object.entries(documents).map(([key, d]) => ({
    key,
    name: d.name,
    href: d.href,
    kind: d.kind ?? null,
    size: d.size ?? null,
  })),
  images: Object.entries(images).map(([key, i]) => ({
    key,
    src: i.src,
    alt: i.alt,
  })),
  videos: Object.entries(videos).map(([key, url]) => ({ key, url })),
  callouts: Object.entries(callouts).map(([key, c]) => ({
    key,
    kind: c.kind,
    text: c.text,
  })),
};

const generatedAt = new Date().toISOString();
const index = {
  generatedAt,
  defaultPageId: DEFAULT_PAGE_ID,
  defaultHref: deepLink(DEFAULT_PAGE_ID),
  counts: {
    categories: categories.length,
    subPages: knownIds.size,
    articles: pages.length,
    documents: registries.documents.length,
    images: registries.images.length,
    videos: registries.videos.length,
    callouts: Object.keys(callouts).length,
    tokens: pages.reduce((n, p) => n + p.tokens.length, 0),
    unresolvedTokens: pages.reduce((n, p) => n + p.tokens.filter((t) => !t.resolved).length, 0),
  },
  categories,
  pages,
  registries,
  orphans,
};

const searchRecords = buildSearchableRecords();
const searchIndex = {
  version: 1,
  generatedAt,
  corpusSignature: computeContentSignature(searchRecords),
  recordCount: searchRecords.length,
  records: searchRecords,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
writeFileSync(SEARCH_OUT_PATH, JSON.stringify(searchIndex, null, 2) + "\n", "utf8");

console.log(
  `✓ Wrote public/content-index.json — ${index.counts.articles} articles, ` +
    `${index.counts.tokens} tokens (${index.counts.unresolvedTokens} unresolved), ` +
    `${index.counts.documents} docs, ${index.counts.images} images, ${index.counts.videos} videos.`,
);
console.log(
  `✓ Wrote public/search-index.json — ${searchIndex.recordCount} records, signature ${searchIndex.corpusSignature}.`,
);
if (index.counts.unresolvedTokens > 0) {
  console.log("  Some tokens did not resolve — run `bun run validate:content` for details.");
}
