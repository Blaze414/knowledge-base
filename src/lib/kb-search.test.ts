import { describe, expect, it } from "vitest";
import {
  buildSearchableRecords,
  computeContentSignature,
  createFuse,
  type SearchCorpus,
} from "@/lib/kb-search";
import { searchKnowledgeBase } from "@/lib/smart-search";
import type { PageContent } from "@/content/types";

function article(id: string, title: string, content: string, tags: string[] = []): PageContent {
  return {
    id,
    categoryId: "support",
    title,
    content,
    tags,
    lastUpdated: "2026-07-16",
    readTime: "1 min read",
  };
}

function corpus(): SearchCorpus {
  return {
    categories: [
      {
        id: "support",
        name: "Customer support",
        subPages: [
          { id: "alpha", title: "Alpha guide" },
          { id: "beta", title: "Beta guide" },
        ],
      },
    ],
    pages: {
      alpha: article(
        "alpha",
        "Return a damaged item",
        "Use the returns form. [doc:return-policy] [image:damage-photo] [video:return-help] [slideshow:return-tour]",
        ["return", "damaged"],
      ),
      beta: article("beta", "General information", "Returns are mentioned in body text."),
    },
    documents: {
      "return-policy": {
        name: "Returns policy",
        href: "/returns.pdf",
        description: "Eligibility and refund timing",
      },
    },
    images: {
      "damage-photo": {
        src: "/damage.webp",
        alt: "Photograph of a damaged parcel",
      },
    },
    videos: { "return-help": "https://example.test/return-video" },
    slideshows: {
      "return-tour": {
        title: "Return walkthrough",
        steps: [
          {
            label: "Step 1",
            title: "Open returns",
            description: "Start a return request",
            image: "/return.webp",
            alt: "Returns form",
          },
        ],
      },
    },
  };
}

describe("search corpus indexing", () => {
  it("automatically includes created articles and removes deleted articles", () => {
    const source = corpus();
    source.pages.gamma = article("gamma", "Track a parcel", "Open shipment tracking.", [
      "tracking",
    ]);
    expect(buildSearchableRecords(source).map((record) => record.id)).toContain("gamma");

    delete source.pages.gamma;
    expect(buildSearchableRecords(source).map((record) => record.id)).not.toContain("gamma");
  });

  it("keeps smart results in sync after create, edit, and delete operations", () => {
    const source = corpus();
    source.pages.gamma = article("gamma", "Track a parcel", "Open shipment tracking.", [
      "tracking",
    ]);

    let records = buildSearchableRecords(source);
    expect(searchKnowledgeBase("track my parcel", records, createFuse(records)).bestMatch?.id).toBe(
      "gamma",
    );

    source.pages.gamma.title = "Find a shipment";
    source.pages.gamma.content = "Use the parcel status page.";
    records = buildSearchableRecords(source);
    expect(
      searchKnowledgeBase("find shipment", records, createFuse(records)).bestMatch?.title,
    ).toBe("Find a shipment");

    delete source.pages.gamma;
    records = buildSearchableRecords(source);
    expect(
      searchKnowledgeBase("find shipment", records, createFuse(records)).bestMatch?.id,
    ).not.toBe("gamma");
  });

  it("changes its signature for same-length edits", () => {
    const source = corpus();
    const before = computeContentSignature(buildSearchableRecords(source));
    source.pages.alpha.content = source.pages.alpha.content.replace("returns", "refunds");
    const after = computeContentSignature(buildSearchableRecords(source));
    expect(source.pages.alpha.content.length).toBe(
      article(
        "alpha",
        "Return a damaged item",
        "Use the returns form. [doc:return-policy] [image:damage-photo] [video:return-help] [slideshow:return-tour]",
      ).content.length,
    );
    expect(after).not.toBe(before);
  });

  it.each([
    ["title", (source: SearchCorpus) => (source.pages.alpha.title = "Refund a damaged item")],
    ["category", (source: SearchCorpus) => (source.categories[0].name = "Returns help")],
    ["tag", (source: SearchCorpus) => source.pages.alpha.tags?.push("faulty")],
    [
      "document metadata",
      (source: SearchCorpus) => (source.documents["return-policy"].description = "Changed policy"),
    ],
    [
      "image metadata",
      (source: SearchCorpus) => (source.images["damage-photo"].alt = "Box damage"),
    ],
    [
      "video metadata",
      (source: SearchCorpus) =>
        (source.videos["return-help"] = "https://example.test/updated-video"),
    ],
    [
      "slideshow metadata",
      (source: SearchCorpus) =>
        (source.slideshows["return-tour"].steps[0].description = "Updated return request"),
    ],
  ])("reacts to %s changes", (_field, mutate) => {
    const source = corpus();
    const before = computeContentSignature(buildSearchableRecords(source));
    mutate(source);
    const after = computeContentSignature(buildSearchableRecords(source));
    expect(after).not.toBe(before);
  });

  it("weights title and tags above body-only matches", () => {
    const source = corpus();
    const records = buildSearchableRecords(source);
    const result = searchKnowledgeBase("damaged return", records, createFuse(records));
    expect(result.bestMatch?.id).toBe("alpha");
    expect(result.bestMatch?.matchReasons).toEqual(expect.arrayContaining(["Title", "Tags"]));
  });

  it("indexes document and media metadata referenced by an article", () => {
    const record = buildSearchableRecords(corpus()).find((item) => item.id === "alpha");
    expect(record?.docNames).toContain("Eligibility and refund timing");
    expect(record?.imageAlts).toContain("damaged parcel");
    expect(record?.videoNames).toContain("return-help");
    expect(record?.videoNames).not.toContain("updated-video");
    expect(record?.slideshowMetadata).toContain("Start a return request");
  });
});
