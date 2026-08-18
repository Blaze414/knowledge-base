/**
 * Drop-in Markdown articles.
 *
 * Put a folder under `src/content/import/`, with one `.md` file and the images
 * it uses beside it:
 *
 *     src/content/import/returns-exchange/
 *       article.md
 *       exchange-form.png
 *       exchange-confirmation.png
 *
 * Run `npm run optimize:images` (or just `npm run build`, which runs it) and the
 * article publishes itself: it appears in its category's sidebar, its images are
 * registered, and its steps render with the circular step badge. Nothing else to
 * edit — no registry entry, no catalogue id, no import statement.
 *
 * The file starts with frontmatter:
 *
 *     ---
 *     id: returns-exchange
 *     title: How to exchange an item
 *     category: returns-refunds
 *     tags: [returns, exchange]
 *     ---
 *
 * `id`, `title`, and `category` are required. Optional: `tags`, `lastUpdated`,
 * `readTime`, `layout`, `parentArticleId`, `order`, `video`.
 *
 * Steps get their circular number from any of these heading forms — all three
 * normalise to the same rendered output:
 *
 *     ## Step 1: Open the order
 *     ## 1. Open the order
 *     ## Step 1 - Open the order
 *
 * Images are written as ordinary Markdown and rewritten to registry tokens, so
 * the alt text travels with the article:
 *
 *     ![Exchange form with the reason field highlighted](exchange-form.png)
 */
import type { PageContent } from "./types";

const markdownFiles = import.meta.glob("./import/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

/** Alt text and captions harvested from Markdown image syntax, keyed by image id. */
export type HarvestedMeta = Record<string, { alt: string; caption?: string }>;
export const importedImageMeta: HarvestedMeta = {};

type Frontmatter = Record<string, string | string[]>;

/**
 * Frontmatter is a deliberately small YAML subset: `key: value`, `key: [a, b]`,
 * and `- item` lists. Enough for article metadata, and it keeps a YAML parser
 * out of the client bundle.
 */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  // \uFEFF tolerates a byte-order mark, which some editors prepend on save.
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Frontmatter = {};
  let currentListKey: string | null = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentListKey) {
      (data[currentListKey] as string[]).push(unquote(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    if (value === "") {
      data[key] = [];
      currentListKey = key;
      continue;
    }
    currentListKey = null;
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => unquote(item.trim()))
        .filter(Boolean);
      continue;
    }
    data[key] = unquote(value);
  }

  return { data, body: match[2] };
}

function unquote(value: string) {
  return value.replace(/^["'](.*)["']$/, "$1").trim();
}

const asString = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;
const asList = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value : value ? [value] : [];

/**
 * Normalise the step heading forms an author might reasonably write into the
 * single form the renderer draws a circular badge for.
 */
function normaliseStepHeadings(body: string) {
  return body
    .split("\n")
    .map((line) => {
      const explicit = line.match(/^##\s+Step\s+(\d+(?:\.\d+)*)\s*(?::|—|–|-)?\s*(.+)$/i);
      if (explicit) return `## Step ${explicit[1]}: ${explicit[2].trim()}`;

      const numbered = line.match(/^##\s+(\d+(?:\.\d+)*)[).:]?\s+(.+)$/);
      if (numbered) return `## Step ${numbered[1]}: ${numbered[2].trim()}`;

      return line;
    })
    .join("\n");
}

/**
 * Rewrite `![alt](file.png)` to the `[image:id]` token the renderer resolves
 * through the image registry, recording the alt text on the way through. The id
 * is the filename, which is exactly what the optimiser names its output.
 */
function extractImages(body: string, meta: HarvestedMeta) {
  return body.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_full, alt: string, href: string, caption?: string) => {
      const isLocalFile = !/^(https?:)?\/\//.test(href) && !href.startsWith("/");
      if (!isLocalFile) return `![${alt}](${href})`;

      const filename = href.slice(href.lastIndexOf("/") + 1);
      const id = filename.replace(/\.[^.]+$/, "");
      meta[id] = { alt: alt.trim(), ...(caption ? { caption } : {}) };
      return `[image:${id}]`;
    },
  );
}

function toArticle(path: string, raw: string, meta: HarvestedMeta): PageContent {
  const { data, body } = parseFrontmatter(raw);
  const folder = path.split("/").at(-2) ?? path;

  const id = asString(data.id) ?? folder;
  const title = asString(data.title);
  const categoryId = asString(data.category) ?? asString(data.categoryId);

  if (!title || !categoryId) {
    throw new Error(
      `Markdown article "${path}" needs both \`title\` and \`category\` in its frontmatter.`,
    );
  }

  const content = extractImages(normaliseStepHeadings(body), meta).trim();
  const layout = asString(data.layout) as PageContent["layout"] | undefined;
  const order = asString(data.order);

  return {
    id,
    categoryId,
    title,
    content: `${content}\n`,
    lastUpdated: asString(data.lastUpdated) ?? "",
    readTime: asString(data.readTime) ?? estimateReadTime(content),
    tags: [categoryId, ...id.split("-"), ...asList(data.tags)],
    ...(layout ? { layout } : {}),
    ...(asString(data.video) ? { video: asString(data.video) } : {}),
    ...(asString(data.parentArticleId) ? { parentArticleId: asString(data.parentArticleId) } : {}),
    ...(order ? { order: Number(order) } : {}),
  };
}

function estimateReadTime(content: string) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Docs and drafts live alongside articles: `README.md` and `_draft.md` are skipped. */
const isArticleFile = (path: string) => {
  const filename = path.slice(path.lastIndexOf("/") + 1);
  return filename !== "README.md" && !filename.startsWith("_");
};

export const markdownArticles: PageContent[] = Object.entries(markdownFiles)
  .filter(([path]) => isArticleFile(path))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, raw]) => toArticle(path, raw, importedImageMeta));

/** Exposed for unit tests only. */
export const __testing = { parseFrontmatter, normaliseStepHeadings, extractImages, toArticle };
