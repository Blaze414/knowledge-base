import type { PageContent, SidebarCategory } from "./types";

export interface RelatedResult {
  pages: PageContent[];
  matchMode: "tags" | "category" | "none";
}

/**
 * Pick up to `limit` articles related to `currentPage`.
 *
 * Ranking:
 *  1. Articles that share at least one tag, ordered by # of shared tags
 *     (ties broken by original order in `allPages`).
 *  2. If no tag overlap exists, fall back to other articles in the same
 *     `category`.
 */
export function getRelatedArticles(
  currentPage: PageContent,
  allPages: PageContent[],
  category: SidebarCategory | undefined,
  limit = 4,
): RelatedResult {
  const currentTags = currentPage.tags ?? [];

  if (currentTags.length > 0) {
    const matches = allPages
      .filter((p) => p.id !== currentPage.id)
      .map((p, idx) => {
        const shared = (p.tags ?? []).filter((t) => currentTags.includes(t)).length;
        return { page: p, shared, idx };
      })
      .filter((m) => m.shared > 0)
      .sort((a, b) => b.shared - a.shared || a.idx - b.idx)
      .slice(0, limit)
      .map((m) => m.page);

    if (matches.length > 0) {
      return { pages: matches, matchMode: "tags" };
    }
  }

  if (category) {
    const pageMap = new Map(allPages.map((p) => [p.id, p]));
    const fallback = category.subPages
      .filter((s) => s.id !== currentPage.id && pageMap.has(s.id))
      .map((s) => pageMap.get(s.id)!)
      .slice(0, limit);
    if (fallback.length > 0) {
      return { pages: fallback, matchMode: "category" };
    }
  }

  return { pages: [], matchMode: "none" };
}
