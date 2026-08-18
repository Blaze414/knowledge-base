import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FormattedArticleContent } from "./knowledge-base";

function renderArticle(content: string, title: string) {
  return renderToStaticMarkup(<FormattedArticleContent content={content} title={title} />);
}

/**
 * End-to-end snapshot: render a full article fragment that uses a
 * registry-backed callout with a multi-line override containing a payload
 * of malicious inline markdown. The render must:
 *   - escape every angle bracket (no live HTML elements from author input)
 *   - still apply the markdown-level <strong>/<em> styling
 *   - keep the surrounding article structure (headings, paragraphs)
 */
describe("article rendering — callout override XSS hardening", () => {
  const ARTICLE = [
    "## Safety check",
    "",
    'Intro paragraph with <script>alert("intro")</script> hostile text.',
    "",
    "[note:back-up-first]: Be **<script>alert('xss')</script>** careful with",
    '<img src=x onerror="alert(1)"> tags and <a href="javascript:alert(1)">links</a>.',
    "",
    "Second paragraph inside the same callout has *<b>bold-ish</b>* fragments",
    "and a stray < bracket plus a > one too.",
    "",
    "",
    "Closing paragraph after the callout.",
  ].join("\n");

  const html = renderArticle(ARTICLE, "Safety check");

  it("does not emit any author-supplied HTML elements", () => {
    // Tags the author tried to inject:
    expect(html).not.toContain("<script");
    expect(html).not.toContain("</script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("</b>");
    // The inline-markdown sanitizer now runs for ALL article paragraphs
    // (intro/body/headings/list items) as well as callouts, so even the
    // escaped-text form of the payload tags must not survive anywhere in
    // the rendered HTML.
    expect(html).not.toMatch(/&lt;\s*script/i);
    expect(html).not.toMatch(/&lt;\s*\/\s*script/i);
    expect(html).not.toMatch(/&lt;\s*img/i);
    expect(html).not.toMatch(/&lt;\s*a\s/i);
    expect(html).not.toMatch(/&lt;\s*b\s*&gt;/i);
  });

  it("preserves intended markdown styling around the sanitized payload", () => {
    // `**...**` around the (stripped) <script> tag still renders <strong>.
    expect(html).toContain("<strong>");
    // `*...*` around the (stripped) <b> tag still renders <em>.
    expect(html).toContain("<em>");
  });

  it("matches the article snapshot", () => {
    expect(html).toMatchSnapshot();
  });
});

describe("article rendering — step scan cues", () => {
  const ARTICLE = [
    "### 1. Open the roster",
    "",
    "**Action:** Open **Peanuts Gang → Overview** from the sidebar.",
    "**Expected outcome:** The roster appears with every active friend.",
    "**Note:** Use filters before editing a large roster.",
  ].join("\n");

  const html = renderArticle(ARTICLE, "Step cues");

  it("renders labelled scan rows with accessible full-width visuals", () => {
    expect(html).toContain("kb-step-cue");
    expect(html).toContain("Action");
    expect(html).toContain("Expected outcome");
    expect(html).not.toContain("Use filters before editing a large roster.");
    expect(html).not.toContain("visual reference");
    expect(html).toContain('alt="Snoopy&#x27;s doghouse command center"');
    expect(html).toContain("sm:col-span-2");
    expect(html).toContain("<strong>Peanuts Gang → Overview</strong>");
  });

  it("lets an article select a cue image with an inline registry token", () => {
    const html = renderArticle(
      "**Action:** Open the store footer. [image:peanuts-support-footer-link]",
      "Article-owned cue image",
    );

    expect(html).toContain(
      'alt="Peanuts Store footer with the Support Center link under Customer Service"',
    );
    expect(html).not.toContain("[image:peanuts-support-footer-link]");
    expect(html).not.toContain("Snoopy&#x27;s doghouse command center");
  });

  it("surfaces an unknown article-owned cue image key", () => {
    const html = renderArticle(
      "**Expected outcome:** The page opens. [image:not-registered]",
      "Bad key",
    );

    expect(html).toContain("Unknown image reference: not-registered");
  });
});

describe("article rendering — nested numbered steps", () => {
  const ARTICLE = [
    "### 5. Save the invite",
    "",
    "**Action:** Click **Save**.",
    "",
    "#### 5.1 Confirm the saved invite",
    "",
    "**Expected outcome:** The status shows **Sent**.",
    "",
    "#### 5.2 Watch for first login",
    "",
    "**Note:** Resend the invite if the badge stays **Invited**.",
  ].join("\n");

  const html = renderArticle(ARTICLE, "Nested steps");

  it("renders sub-step labels without treating them as plain paragraphs", () => {
    expect(html).toContain(">5<");
    expect(html).toContain(">5.1<");
    expect(html).toContain(">5.2<");
    expect(html).toContain("Confirm the saved invite");
    expect(html).toContain("Watch for first login");
    expect(html).toContain("Expected outcome");
    expect(html).not.toContain("Resend the invite");
    expect(html.match(/sm:ml-16/g)?.length).toBe(1);
  });
});

describe("article rendering — section step badges", () => {
  const html = renderArticle(
    [
      "## Step 1: Open the Support Center",
      "",
      "Open the footer link.",
      "",
      "## Step 2.1: Search for Help",
    ].join("\n"),
    "Support steps",
  );

  it("moves section step numbers into fixed circular badges", () => {
    expect(html).toContain("h-9 w-9");
    expect(html).toContain(">1<");
    expect(html).toContain(">2.1<");
    expect(html).toContain("Open the Support Center");
    expect(html).toContain("Search for Help");
    expect(html).toContain('sr-only">Step 2.1: ');
    expect(html).not.toContain(">Step 1: Open the Support Center<");
  });
});
