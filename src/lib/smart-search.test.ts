import { beforeAll, describe, expect, it } from "vitest";
import { buildSearchableRecords, createFuse, type SearchableRecord } from "@/lib/kb-search";
import {
  editDistance,
  expandSearchQuery,
  getSearchResultBadge,
  searchKnowledgeBase,
} from "@/lib/smart-search";

describe("smart knowledge-base search", () => {
  let records: SearchableRecord[];

  beforeAll(() => {
    records = buildSearchableRecords();
  });

  const search = (query: string) => searchKnowledgeBase(query, records, createFuse(records));

  it.each([
    ["Where is my order?", "shipping-track-order"],
    ["How can I talk to someone?", "guides-contact-customer-support"],
    ["my promo code wont work", "ordering-apply-coupon"],
    ["How do I choose the right phone case?", "shopping-phone-case-model"],
  ])("understands conversational query %s", (query, expectedId) => {
    const result = search(query);
    expect(result.status).toBe("results");
    expect(result.bestMatch?.id).toBe(expectedId);
  });

  it("combines exact keywords with weighted title and tag matches", () => {
    const result = search("coupon");
    expect(result.bestMatch?.id).toBe("ordering-apply-coupon");
    expect(result.bestMatch?.matchReasons).toContain("Title");
    expect(result.related.map((item) => item.id)).toContain("ordering-missing-newsletter-coupon");
  });

  it("keeps result excerpts focused on article guidance instead of source URLs", () => {
    const result = search("Where is my order?");
    expect(result.bestMatch?.snippet).not.toMatch(/https?:\/\/|\bSources?\b/i);
    expect(result.bestMatch?.snippet).not.toMatch(/shipping-tracking|##/i);
  });

  it("uses conservative synonym expansion", () => {
    expect(expandSearchQuery("a present for someone").expandedTokens).toContain("gift");
    expect(search("a present for someone").bestMatch?.id).toBe("gifts-send-to-recipient");
  });

  it("tolerates multiple spelling mistakes", () => {
    const result = search("retun damaged produxt");
    expect(result.status).toBe("results");
    expect(result.bestMatch?.id).toBe("returns-damaged-product");
    expect(result.isSpellingTolerantMatch).toBe(true);
    expect(editDistance("retun", "return")).toBe(1);
  });

  it("labels an uncertain spelling match honestly", () => {
    const result = search("how to trak my shipmnt");
    expect(result.status).toBe("low-confidence");
    expect(result.bestMatch).toBeNull();
    expect(result.related[0]?.id).toBe("shipping-track-order");
  });

  it("returns useful suggestions for an empty query", () => {
    const result = search("   ");
    expect(result.status).toBe("idle");
    expect(result.bestMatch).toBeNull();
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it("does not manufacture a match for unrelated text", () => {
    const result = search("flibbertigibbet quantum banana");
    expect(result.status).toBe("no-results");
    expect(result.bestMatch).toBeNull();
    expect(result.related).toEqual([]);
  });

  it("labels result strength without exposing pseudo-precise scores", () => {
    expect(getSearchResultBadge({ confidence: "high", score: 100 }, true)).toBe("Best match");
    expect(getSearchResultBadge({ confidence: "high", score: 70 }, false, 100)).toBe(
      "Strong match",
    );
    expect(getSearchResultBadge({ confidence: "high", score: 70 }, false, 100, 4)).toBe("Relevant");
    expect(getSearchResultBadge({ confidence: "high", score: 45 }, false, 100, 2)).toBe("Relevant");
    expect(getSearchResultBadge({ confidence: "low", score: 20 }, false, 100)).toBe(
      "Possible match",
    );
  });
});
