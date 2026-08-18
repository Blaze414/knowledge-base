import { knowledgeBaseGroups } from "../catalog";
import { markdownArticles } from "../markdown-articles";
import type { PageContent } from "../types";

const standardArticleModules = import.meta.glob<PageContent>("./standard/**/*.ts", {
  eager: true,
  import: "default",
});
const customArticleModules = import.meta.glob<PageContent>("./custom/*.ts", {
  eager: true,
  import: "default",
});

/**
 * Every active article owns its content in a dedicated module. The catalogue
 * contains ordered IDs only; this loader resolves those references and appends
 * any unlisted module to the end of its own category, so dropping a new file
 * into `standard/` or `custom/` publishes it without editing `catalog.ts`.
 * List an id in the catalogue when its position in the sidebar matters.
 */
const loadedArticles = [
  ...Object.values(standardArticleModules),
  ...Object.values(customArticleModules),
  ...markdownArticles,
];

const loadedById = new Map<string, PageContent>();
for (const article of loadedArticles) {
  if (loadedById.has(article.id)) {
    throw new Error(`Duplicate article module id "${article.id}".`);
  }
  loadedById.set(article.id, article);
}

const catalogueOrder = knowledgeBaseGroups.flatMap((group) => group.articleIds);
const catalogueIds = new Set(catalogueOrder);
const orderedArticles = catalogueOrder.flatMap((id) => {
  const article = loadedById.get(id);
  if (!article) return [];
  const group = knowledgeBaseGroups.find((candidate) => candidate.id === article.categoryId);
  return [{ ...article, order: group?.articleIds.indexOf(id) ?? article.order }];
});
const orphanArticles = loadedArticles
  .filter((article) => !catalogueIds.has(article.id))
  .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title));
const articles: PageContent[] = [...orderedArticles, ...orphanArticles];

/**
 * Catalogue groups with auto-discovered articles folded in: catalogue order
 * first, then any module that named this category but was never listed. Ids
 * with no module are dropped here — `validate:content` reports them.
 */
export const resolvedGroups = knowledgeBaseGroups.map((group) => ({
  ...group,
  articleIds: [
    ...group.articleIds.filter((id) => loadedById.has(id)),
    ...orphanArticles.filter((article) => article.categoryId === group.id).map(({ id }) => id),
  ],
}));

export const pageContents: Record<string, PageContent> = Object.fromEntries(
  articles.map((article) => [article.id, article]),
);

export const DEFAULT_PAGE_ID = "shopping-browse-by-character";

export function getPage(id: string): PageContent | undefined {
  return pageContents[id];
}

/** Articles in declaration order, with `order` overriding when present. */
function siblingsOf(parentId: string | undefined, categoryId: string): PageContent[] {
  const matches = articles.filter(
    (article) =>
      article.categoryId === categoryId && (article.parentArticleId ?? undefined) === parentId,
  );
  return matches.slice().sort((a, b) => {
    const aOrder = a.order ?? articles.indexOf(a);
    const bOrder = b.order ?? articles.indexOf(b);
    return aOrder - bOrder;
  });
}

/** Direct child articles of `parentId`, ordered. */
export function getChildren(parentId: string): PageContent[] {
  const parent = pageContents[parentId];
  if (!parent) return [];
  return siblingsOf(parentId, parent.categoryId);
}

/**
 * Dotted hierarchical number for an article, derived from sidebar order.
 * Returns `null` if the article is not part of the navigation catalogue.
 */
export function getNumbering(pageId: string): string | null {
  const article = pageContents[pageId];
  if (!article) return null;
  const category = resolvedGroups.find((item) => item.id === article.categoryId);
  if (!category) return null;

  if (!article.parentArticleId) {
    const topLevel = category.articleIds.filter(
      (id) => !pageContents[id]?.parentArticleId && pageContents[id],
    );
    const index = topLevel.indexOf(pageId);
    return index >= 0 ? String(index + 1) : null;
  }

  const parentNumber = getNumbering(article.parentArticleId);
  if (!parentNumber) return null;

  const sidebarChildren = category.articleIds.filter(
    (id) => pageContents[id]?.parentArticleId === article.parentArticleId && pageContents[id],
  );
  let index = sidebarChildren.indexOf(pageId);
  if (index < 0) {
    const siblings = siblingsOf(article.parentArticleId, article.categoryId);
    index = siblings.findIndex((sibling) => sibling.id === pageId);
  }
  return index >= 0 ? `${parentNumber}.${index + 1}` : null;
}
