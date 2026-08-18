import { describe, it, expect } from "vitest";
import { getRelatedArticles } from "./related";
import type { PageContent, SidebarCategory } from "./types";

function page(id: string, categoryId: string, tags?: string[]): PageContent {
  return {
    id,
    categoryId,
    title: id,
    content: "",
    lastUpdated: "2024-01-01",
    readTime: "1 min read",
    tags,
  };
}

function category(id: string, subPageIds: string[]): SidebarCategory {
  return {
    id,
    name: id,
    icon: null,
    subPages: subPageIds.map((sid) => ({ id: sid, title: sid, parentId: id })),
  };
}

describe("getRelatedArticles", () => {
  it("ranks by number of shared tags first", () => {
    const current = page("a", "cat1", ["x", "y", "z"]);
    const all = [
      current,
      page("b", "cat2", ["x"]), // 1 shared
      page("c", "cat3", ["x", "y"]), // 2 shared — best match
      page("d", "cat1", ["y", "z"]), // 2 shared (same cat, but tags rule)
      page("e", "cat4", ["unrelated"]), // 0 shared
    ];
    const cat = category("cat1", ["a", "d"]);
    const result = getRelatedArticles(current, all, cat);

    expect(result.matchMode).toBe("tags");
    expect(result.pages.map((p) => p.id)).toEqual(["c", "d", "b"]);
    expect(result.pages.find((p) => p.id === "e")).toBeUndefined();
  });

  it("excludes the current page from results", () => {
    const current = page("a", "cat1", ["x"]);
    const all = [current, page("b", "cat1", ["x"])];
    const cat = category("cat1", ["a", "b"]);
    const result = getRelatedArticles(current, all, cat);

    expect(result.pages.map((p) => p.id)).toEqual(["b"]);
  });

  it("respects the result limit", () => {
    const current = page("a", "cat1", ["x"]);
    const all = [
      current,
      page("b", "cat1", ["x"]),
      page("c", "cat2", ["x"]),
      page("d", "cat3", ["x"]),
      page("e", "cat4", ["x"]),
      page("f", "cat5", ["x"]),
    ];
    const result = getRelatedArticles(current, all, category("cat1", ["a", "b"]), 3);
    expect(result.pages).toHaveLength(3);
  });

  it("falls back to category siblings when no tags overlap", () => {
    const current = page("a", "cat1", ["only-mine"]);
    const all = [
      current,
      page("b", "cat1", ["other"]),
      page("c", "cat1", ["different"]),
      page("d", "cat2", ["other"]),
    ];
    const cat = category("cat1", ["a", "b", "c"]);
    const result = getRelatedArticles(current, all, cat);

    expect(result.matchMode).toBe("category");
    expect(result.pages.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("falls back to category when current page has no tags at all", () => {
    const current = page("a", "cat1");
    const all = [current, page("b", "cat1", ["x"]), page("c", "cat1")];
    const cat = category("cat1", ["a", "b", "c"]);
    const result = getRelatedArticles(current, all, cat);

    expect(result.matchMode).toBe("category");
    expect(result.pages.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("returns empty when no tag matches and no category provided", () => {
    const current = page("a", "cat1", ["solo"]);
    const all = [current, page("b", "cat2", ["other"])];
    const result = getRelatedArticles(current, all, undefined);

    expect(result.matchMode).toBe("none");
    expect(result.pages).toEqual([]);
  });
});
