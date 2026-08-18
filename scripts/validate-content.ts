/**
 * Validates the knowledge base content graph.
 *
 *   bun run validate:content
 *
 * Checks performed:
 *   1. Every category sub-page id has a matching `pageContents` entry.
 *   2. Every article's `categoryId` matches a real category and that
 *      category lists the article id.
 *   3. Every article id appears exactly once across all categories.
 *   4. `DEFAULT_PAGE_ID` resolves to an existing article.
 *   5. Every inline `[video:key] / [image:key] / [doc:key]` token in
 *      article content resolves through its registry.
 *   6. Every referenced document href under `/docs/` points at a real
 *      file in `public/`.
 *   7. Every inline markdown link `[text](href)` in article content
 *      resolves: `/?page=<id>` to a real article, `/docs/...` to a
 *      real file in `public/`, and `#anchor` to a real heading on the
 *      same page.
 *   8. Every `@/assets/...` import in a content or component module
 *      points at a file that exists on disk.
 *   9. Auto-discovered image ids are unique across source folders, and
 *      every image an article references has alt text.
 *
 * Exits with code 1 on any failure so it can run in CI.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { sidebarCategories } from "../src/content/categories";
import { pageContents, DEFAULT_PAGE_ID } from "../src/content/articles";
import { documents } from "../src/content/documents";
import { images } from "../src/content/images";
import { videos } from "../src/content/videos";
import { callouts } from "../src/content/callouts";
import { slideshows } from "../src/content/slideshows";
import { quizzes } from "../src/content/quizzes";
import { choosers } from "../src/content/choosers";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC_DIR = join(PROJECT_ROOT, "public");
const SRC_DIR = join(PROJECT_ROOT, "src");

type Issue = { kind: "error" | "warn"; where: string; message: string };
const issues: Issue[] = [];
const err = (where: string, message: string) => issues.push({ kind: "error", where, message });
const warn = (where: string, message: string) => issues.push({ kind: "warn", where, message });

// 1 + 2 + 3 — category ↔ article graph
const seenIds = new Map<string, string>(); // id → categoryId
for (const cat of sidebarCategories) {
  for (const sub of cat.subPages) {
    if (sub.parentId !== cat.id) {
      err(
        `categories.${cat.id}.${sub.id}`,
        `parentId "${sub.parentId}" does not match its category id "${cat.id}".`,
      );
    }
    if (seenIds.has(sub.id)) {
      err(
        `categories.${cat.id}.${sub.id}`,
        `duplicate sub-page id (also in "${seenIds.get(sub.id)}").`,
      );
    }
    seenIds.set(sub.id, cat.id);

    const article = pageContents[sub.id];
    if (!article) {
      err(
        `categories.${cat.id}.${sub.id}`,
        `catalogue reference has no article module under src/content/articles/standard/ or custom/.`,
      );
      continue;
    }
    if (article.categoryId !== cat.id) {
      err(
        `articles.${sub.id}`,
        `article.categoryId = "${article.categoryId}" but it is listed under category "${cat.id}".`,
      );
    }
  }
}

for (const [id, article] of Object.entries(pageContents)) {
  if (article.id !== id) {
    err(`articles.${id}`, `article.id "${article.id}" does not match map key "${id}".`);
  }
  if (!seenIds.has(id)) {
    err(`articles.${id}`, `article exists but is not listed under any category in categories.tsx.`);
  }
  if (article.parentArticleId) {
    const parent = pageContents[article.parentArticleId];
    if (!parent) {
      err(
        `articles.${id}`,
        `parentArticleId "${article.parentArticleId}" does not resolve to an article.`,
      );
    } else if (parent.categoryId !== article.categoryId) {
      err(
        `articles.${id}`,
        `parentArticleId "${article.parentArticleId}" lives in "${parent.categoryId}" but child is in "${article.categoryId}".`,
      );
    }
  }
}

// Chooser graph integrity — every `next` resolves to a step id or article.
for (const [key, chooser] of Object.entries(choosers)) {
  const stepIds = new Set(chooser.steps.map((s) => s.id));
  if (!stepIds.has(chooser.start)) {
    err(`choosers.${key}`, `start step "${chooser.start}" does not exist.`);
  }
  for (const step of chooser.steps) {
    for (const [i, opt] of step.options.entries()) {
      if (opt.next.startsWith("article:")) {
        const pid = opt.next.slice("article:".length);
        if (!pageContents[pid]) {
          err(`choosers.${key}.${step.id}[${i}]`, `option targets unknown article "${pid}".`);
        }
      } else if (!stepIds.has(opt.next)) {
        err(`choosers.${key}.${step.id}[${i}]`, `option targets unknown step "${opt.next}".`);
      }
    }
  }
}

// 4 — default page
if (!pageContents[DEFAULT_PAGE_ID]) {
  err("DEFAULT_PAGE_ID", `"${DEFAULT_PAGE_ID}" does not resolve to an article.`);
}

// 5 — content tokens. Callouts may include an optional inline override:
//     [note:key]: My custom description
const TOKEN =
  /^\[(video|image|doc|slideshow|quiz|chooser|note|warn|warning):([\w-]+)\](?::\s*.+)?$/;
const calloutRegistry = callouts as Record<string, unknown>;
const registries: Record<string, Record<string, unknown>> = {
  video: videos as Record<string, unknown>,
  image: images as Record<string, unknown>,
  doc: documents as Record<string, unknown>,
  slideshow: slideshows as Record<string, unknown>,
  quiz: quizzes as Record<string, unknown>,
  chooser: choosers as Record<string, unknown>,
  note: calloutRegistry,
  warn: calloutRegistry,
  warning: calloutRegistry,
};

for (const article of Object.values(pageContents)) {
  const lines = article.content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(TOKEN);
    if (!m) continue;
    const [, kind, key] = m;
    if (!(key in registries[kind])) {
      err(`articles.${article.id}:${i + 1}`, `unknown ${kind} reference "[${kind}:${key}]".`);
    }
  }
}

// 6 — document href resolution for /docs/* files in public/
for (const [key, doc] of Object.entries(documents)) {
  if (!doc.href) {
    err(`documents.${key}`, `missing href.`);
    continue;
  }
  if (doc.href.startsWith("/")) {
    const local = join(PUBLIC_DIR, doc.href.replace(/^\//, ""));
    if (!existsSync(local)) {
      err(`documents.${key}`, `href "${doc.href}" does not exist at public${doc.href}.`);
    }
  }
}

// 7 — inline markdown links in article content
function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// 7.5 — numbered step continuity. Any `### N. …` heading sequence must
// start at 1 and increment by 1, even when collapsibles/callouts are
// interleaved. Catches accidental renumbering after edits.
for (const article of Object.values(pageContents)) {
  const lines = article.content.split("\n");
  let expected = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^###\s+(\d+)\.\s+/);
    if (!m) continue;
    const n = Number(m[1]);
    if (expected === 0) {
      if (n !== 1) {
        err(`articles.${article.id}:${i + 1}`, `numbered steps must start at 1, found "${n}".`);
      }
      expected = n + 1;
    } else {
      if (n !== expected) {
        err(
          `articles.${article.id}:${i + 1}`,
          `step out of order — expected "${expected}", found "${n}".`,
        );
      }
      expected = n + 1;
    }
  }
}

const MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

for (const article of Object.values(pageContents)) {
  const headings = new Set<string>();
  for (const line of article.content.split("\n")) {
    if (line.startsWith("## ")) headings.add(slugifyHeading(line.slice(3)));
    if (line.startsWith("### ")) headings.add(slugifyHeading(line.slice(4)));
  }
  const lines = article.content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    MD_LINK.lastIndex = 0;
    while ((m = MD_LINK.exec(line))) {
      const href = m[2];
      // External or mailto/tel — skip.
      if (/^(https?:|mailto:|tel:)/i.test(href)) continue;
      // Same-page hash anchor.
      if (href.startsWith("#")) {
        const id = href.slice(1);
        if (!headings.has(id)) {
          err(
            `articles.${article.id}:${i + 1}`,
            `broken anchor link "${href}" — no matching heading on this page.`,
          );
        }
        continue;
      }
      // /?page=<id> internal article link.
      const pageMatch = href.match(/^\/\?page=([\w-]+)(?:#([\w-]+))?$/);
      if (pageMatch) {
        const [, targetId, anchor] = pageMatch;
        const target = pageContents[targetId];
        if (!target) {
          err(
            `articles.${article.id}:${i + 1}`,
            `broken article link "${href}" — page "${targetId}" not found.`,
          );
        } else if (anchor) {
          const targetHeadings = new Set<string>();
          for (const l of target.content.split("\n")) {
            if (l.startsWith("## ")) targetHeadings.add(slugifyHeading(l.slice(3)));
            if (l.startsWith("### ")) targetHeadings.add(slugifyHeading(l.slice(4)));
          }
          if (!targetHeadings.has(anchor)) {
            err(
              `articles.${article.id}:${i + 1}`,
              `broken anchor "#${anchor}" on article "${targetId}".`,
            );
          }
        }
        continue;
      }
      // /docs/... static asset.
      if (href.startsWith("/docs/") || href.startsWith("/")) {
        const cleanPath = href.split("#")[0].split("?")[0];
        const local = join(PUBLIC_DIR, cleanPath.replace(/^\//, ""));
        if (!existsSync(local)) {
          err(
            `articles.${article.id}:${i + 1}`,
            `broken file link "${href}" — public${cleanPath} not found.`,
          );
        }
        continue;
      }
      warn(
        `articles.${article.id}:${i + 1}`,
        `unrecognized link target "${href}" — link integrity could not be verified.`,
      );
    }
  }
}

// 8 — asset imports resolve on disk. Bundlers rewrite `@/assets/...` specifiers
// to URLs without reading the file, so a deleted image only surfaces as an
// opaque build error much later. Scan the source text instead.
const ASSET_IMPORT = /["'](@\/assets\/[^"']+)["']/g;

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* sourceFiles(full);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      yield full;
    }
  }
}

for (const file of sourceFiles(SRC_DIR)) {
  const text = readFileSync(file, "utf8");
  for (const [, specifier] of text.matchAll(ASSET_IMPORT)) {
    const onDisk = join(SRC_DIR, specifier.replace("@/", ""));
    if (!existsSync(onDisk)) {
      const where = file.slice(PROJECT_ROOT.length);
      err(where, `imports "${specifier}" but that file does not exist.`);
    }
  }
}

// 9a — image ids are filenames, so two folders cannot own the same basename.
const OPTIMIZED_DIR = join(SRC_DIR, "assets", "media", "optimized");
const idOwners = new Map<string, string[]>();

function collectOptimized(dir: string, prefix = "") {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectOptimized(full, prefix ? `${prefix}/${entry}` : entry);
      continue;
    }
    if (!entry.endsWith(".webp") || entry.endsWith("-768.webp")) continue;
    const id = entry.replace(/\.webp$/, "");
    idOwners.set(id, [...(idOwners.get(id) ?? []), prefix || "."]);
  }
}
collectOptimized(OPTIMIZED_DIR);

for (const [id, owners] of idOwners) {
  if (owners.length > 1) {
    err(
      `images.${id}`,
      `image id is claimed by ${owners.length} folders (${owners.join(", ")}). ` +
        `Ids come from the filename — rename one of the source files.`,
    );
  }
}

// 9b — alt text is not optional for an image an article actually renders.
const referencedImages = new Set<string>();
for (const article of Object.values(pageContents)) {
  for (const line of article.content.split("\n")) {
    const token = line.trim().match(/^\[image:([\w-]+)\]/);
    if (token) referencedImages.add(token[1]);
    for (const [, key] of line.matchAll(/\[image:([\w-]+)\]/g)) referencedImages.add(key);
  }
}
for (const key of referencedImages) {
  const image = (images as Record<string, { alt?: string }>)[key];
  if (image && !image.alt?.trim()) {
    err(
      `images.${key}`,
      `is used by an article but has no alt text. Add an entry to \`imageMeta\` in ` +
        `src/content/images.ts, or write the alt text in the Markdown image link.`,
    );
  }
}

// ── Report ─────────────────────────────────────────────────────────────
const errors = issues.filter((i) => i.kind === "error");
const warnings = issues.filter((i) => i.kind === "warn");

const fmt = (i: Issue) => `  ${i.kind === "error" ? "✗" : "⚠"} ${i.where} — ${i.message}`;

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((i) => console.log(fmt(i)));
}

if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach((i) => console.log(fmt(i)));
  console.log("");
  process.exit(1);
}

const stats = {
  categories: sidebarCategories.length,
  subPages: [...seenIds.keys()].length,
  articles: Object.keys(pageContents).length,
  documents: Object.keys(documents).length,
  images: Object.keys(images).length,
  videos: Object.keys(videos).length,
  callouts: Object.keys(callouts).length,
  slideshows: Object.keys(slideshows).length,
};
console.log(
  `\n✓ Content graph OK — ${stats.categories} categories, ${stats.subPages} sub-pages, ` +
    `${stats.articles} articles, ${stats.documents} docs, ${stats.images} images, ${stats.videos} videos, ${stats.callouts} callouts, ${stats.slideshows} slideshows.` +
    (warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"})` : ""),
);
