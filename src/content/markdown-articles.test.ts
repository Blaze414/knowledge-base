import { describe, expect, it } from "vitest";

import { __testing } from "./markdown-articles";

const { parseFrontmatter, normaliseStepHeadings, extractImages, toArticle } = __testing;

describe("markdown article frontmatter", () => {
  it("reads scalars, inline lists, and dash lists", () => {
    const { data, body } = parseFrontmatter(
      [
        "---",
        "id: returns-exchange",
        'title: "How to exchange an item"',
        "category: returns-refunds",
        "tags: [returns, exchange]",
        "sources:",
        "  - Peanuts Store",
        "---",
        "",
        "Body text.",
      ].join("\n"),
    );

    expect(data.id).toBe("returns-exchange");
    expect(data.title).toBe("How to exchange an item");
    expect(data.tags).toEqual(["returns", "exchange"]);
    expect(data.sources).toEqual(["Peanuts Store"]);
    expect(body.trim()).toBe("Body text.");
  });

  it("leaves a file without frontmatter intact", () => {
    const { data, body } = parseFrontmatter("# Just content\n");
    expect(data).toEqual({});
    expect(body).toBe("# Just content\n");
  });
});

describe("step heading normalisation", () => {
  it("accepts every reasonable step heading form", () => {
    const input = [
      "## Step 1: Open the order",
      "## 2. Choose the item",
      "## Step 3 - Print the label",
      "## 4) Post the parcel",
      "## Not a step heading",
    ].join("\n");

    expect(normaliseStepHeadings(input).split("\n")).toEqual([
      "## Step 1: Open the order",
      "## Step 2: Choose the item",
      "## Step 3: Print the label",
      "## Step 4: Post the parcel",
      "## Not a step heading",
    ]);
  });

  it("keeps nested step numbers", () => {
    expect(normaliseStepHeadings("## 2.1 Attach the label")).toBe("## Step 2.1: Attach the label");
  });
});

describe("image extraction", () => {
  it("rewrites local images to registry tokens and keeps the alt text", () => {
    const meta: Record<string, { alt: string; caption?: string }> = {};
    const out = extractImages('![Exchange form](exchange-form.png "Fill every field")', meta);

    expect(out).toBe("[image:exchange-form]");
    expect(meta["exchange-form"]).toEqual({
      alt: "Exchange form",
      caption: "Fill every field",
    });
  });

  it("leaves remote images alone", () => {
    const meta: Record<string, { alt: string; caption?: string }> = {};
    const remote = "![Logo](https://example.com/logo.png)";
    expect(extractImages(remote, meta)).toBe(remote);
    expect(meta).toEqual({});
  });
});

describe("article assembly", () => {
  const raw = [
    "---",
    "title: How to exchange an item",
    "category: returns-refunds",
    "tags: [exchange]",
    "---",
    "",
    "## 1. Open the order",
    "",
    "![Order list](order-list.png)",
  ].join("\n");

  it("derives the id from the folder when frontmatter omits it", () => {
    const article = toArticle("./import/returns-exchange/article.md", raw, {});
    expect(article.id).toBe("returns-exchange");
    expect(article.categoryId).toBe("returns-refunds");
    expect(article.content).toContain("## Step 1: Open the order");
    expect(article.content).toContain("[image:order-list]");
    expect(article.tags).toContain("exchange");
    expect(article.readTime).toMatch(/min read$/);
  });

  it("fails loudly when required frontmatter is missing", () => {
    expect(() => toArticle("./import/broken/article.md", "# No frontmatter", {})).toThrow(
      /title.*category/i,
    );
  });
});
