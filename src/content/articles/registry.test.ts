import { describe, expect, it } from "vitest";

import { knowledgeBaseGroups } from "../catalog";
import { pageContents } from ".";

describe("modular article registry", () => {
  const catalogueEntries = knowledgeBaseGroups.flatMap((group) =>
    group.articleIds.map((id) => ({ id, categoryId: group.id })),
  );

  it("keeps the catalogue reference-only", () => {
    for (const group of knowledgeBaseGroups) {
      expect(group).not.toHaveProperty("articles");
      expect(group.articleIds.every((id) => typeof id === "string")).toBe(true);
    }
  });

  it("resolves every catalogue ID to exactly one matching article module", () => {
    const ids = catalogueEntries.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const { id, categoryId } of catalogueEntries) {
      expect(pageContents[id], `Missing article module for ${id}`).toBeDefined();
      expect(pageContents[id]?.categoryId).toBe(categoryId);
    }
  });

  it("does not load article modules that are absent from the catalogue", () => {
    expect(Object.keys(pageContents).sort()).toEqual(catalogueEntries.map(({ id }) => id).sort());
  });
});
