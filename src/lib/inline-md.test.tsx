import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseInlineSegments,
  renderInlineMarkdown,
  sanitizeInlineText,
  INLINE_MD_MAX_LENGTH,
  INLINE_MD_TRUNCATION_MARKER,
} from "./inline-md";

describe("parseInlineSegments", () => {
  it("returns a single text segment when there is no markdown", () => {
    expect(parseInlineSegments("plain text")).toEqual([{ kind: "text", text: "plain text" }]);
  });

  it("extracts **bold** and *emphasis* runs", () => {
    expect(parseInlineSegments("Hello **world** and *friends* — be careful")).toEqual([
      { kind: "text", text: "Hello " },
      { kind: "bold", text: "world" },
      { kind: "text", text: " and " },
      { kind: "em", text: "friends" },
      { kind: "text", text: " — be careful" },
    ]);
  });

  it("prefers ** over * so bold is not split into italic pairs", () => {
    expect(parseInlineSegments("**foo**")).toEqual([{ kind: "bold", text: "foo" }]);
  });

  it("leaves stray asterisks as literal text", () => {
    expect(parseInlineSegments("5 * 3 = 15")).toEqual([{ kind: "text", text: "5 * 3 = 15" }]);
  });
});

describe("inline-md length guard", () => {
  it("parses inputs at exactly the cap without truncation marker", () => {
    const input = "a".repeat(INLINE_MD_MAX_LENGTH);
    const segs = parseInlineSegments(input);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: "text", text: input });
  });

  it("truncates oversized input and appends an ellipsis marker", () => {
    const input = "b".repeat(INLINE_MD_MAX_LENGTH + 5_000);
    const segs = parseInlineSegments(input);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe("text");
    expect(segs[0].text.length).toBe(INLINE_MD_MAX_LENGTH + INLINE_MD_TRUNCATION_MARKER.length);
    expect(segs[0].text.endsWith(INLINE_MD_TRUNCATION_MARKER)).toBe(true);
  });

  it("stays fast on a pathological asterisk-heavy input", () => {
    // Without a length cap, alternating `*` characters can push the
    // bold/em regex into expensive backtracking. With the cap in place
    // this completes well under a second.
    const input = "*a".repeat(INLINE_MD_MAX_LENGTH); // ~20k chars pre-clamp
    const start = Date.now();
    const segs = parseInlineSegments(input);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(segs.length).toBeGreaterThan(0);
    // The last segment should carry the truncation marker, proving we
    // ran against the clamped (not raw) input.
    const last = segs[segs.length - 1];
    expect(last.text.endsWith(INLINE_MD_TRUNCATION_MARKER)).toBe(true);
  });

  it("clamps before sanitizing so an oversized tag soup still completes", () => {
    const input = "<script>".repeat(INLINE_MD_MAX_LENGTH);
    const start = Date.now();
    const cleaned = sanitizeInlineText(
      input.length > INLINE_MD_MAX_LENGTH ? input.slice(0, INLINE_MD_MAX_LENGTH) : input,
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    // Every tag is stripped — no angle brackets survive.
    expect(cleaned).not.toContain("<");
    expect(cleaned).not.toContain(">");
  });
});

describe("sanitizeInlineText", () => {
  it("strips HTML tags entirely", () => {
    expect(sanitizeInlineText("hello <script>alert(1)</script> world")).toBe(
      "hello alert(1) world",
    );
  });

  it("strips self-closing and attribute-laden tags", () => {
    expect(sanitizeInlineText('see <img src=x onerror="alert(1)" /> here')).toBe("see  here");
  });

  it("removes stray angle brackets", () => {
    expect(sanitizeInlineText("a < b and c > d")).toBe("a  b and c  d");
  });

  it("leaves safe text untouched", () => {
    expect(sanitizeInlineText("press **save** then *exit*")).toBe("press **save** then *exit*");
  });

  it("removes a lone unclosed opening tag", () => {
    expect(sanitizeInlineText("hello <script world")).toBe("hello ");
  });

  it("removes a partial tag missing its closing bracket", () => {
    expect(sanitizeInlineText('foo <div class="x" bar')).toBe("foo ");
  });

  it("removes a partial closing tag", () => {
    // An unterminated closing tag swallows the rest of the run — better to
    // drop trailing text than to leak a half-tag into the output.
    expect(sanitizeInlineText("end </script and more")).toBe("end ");
  });

  it("removes a stray greater-than before inline parsing", () => {
    expect(sanitizeInlineText("a > b")).toBe("a  b");
    // And the inline parser must not treat surrounding text as markdown.
    expect(parseInlineSegments("> not a quote")).toEqual([{ kind: "text", text: " not a quote" }]);
  });

  it("removes multiple malformed fragments in one string", () => {
    expect(sanitizeInlineText("<x <y> mid </z bad > tail")).toBe(" mid  tail");
  });

  it("strips angle brackets before bold/em parsing runs", () => {
    // The `<b>` fragments must be gone by the time `**...**` is matched,
    // so the result is a single bold segment with clean inner text.
    expect(parseInlineSegments("**<b>hi</b>**")).toEqual([{ kind: "bold", text: "hi" }]);
  });
});

describe("renderInlineMarkdown XSS hardening", () => {
  it("does not render <script> tags from user input", () => {
    const html = renderToStaticMarkup(
      <>{renderInlineMarkdown("danger <script>alert('xss')</script> here", [], { n: 0 })}</>,
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("</script");
    expect(html).toMatchInlineSnapshot(`"danger alert(&#x27;xss&#x27;) here"`);
  });

  it("does not render <img onerror> from user input", () => {
    const html = renderToStaticMarkup(
      <>{renderInlineMarkdown('oops <img src=x onerror="alert(1)"> end', [], { n: 0 })}</>,
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).toMatchInlineSnapshot(`"oops  end"`);
  });

  it("does not render <a href=javascript:...> from user input", () => {
    const html = renderToStaticMarkup(
      <>{renderInlineMarkdown('click <a href="javascript:alert(1)">me</a> now', [], { n: 0 })}</>,
    );
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("javascript:");
    // The visible link text survives, but no anchor tag is produced.
    expect(html).toMatchInlineSnapshot(`"click me now"`);
  });

  it("still applies **bold** around sanitized text", () => {
    const html = renderToStaticMarkup(
      <>{renderInlineMarkdown("be **<b>careful</b>** now", [], { n: 0 })}</>,
    );
    expect(html).not.toContain("<b>");
    expect(html).toMatchInlineSnapshot(`"be <strong>careful</strong> now"`);
  });
});

describe("renderInlineMarkdown snapshots", () => {
  it("renders <strong> and <em> with search highlights inside", () => {
    const html = renderToStaticMarkup(
      <>{renderInlineMarkdown("Press **save** then *exit*", ["save"], { n: 0 })}</>,
    );
    expect(html).toMatchInlineSnapshot(
      `"Press <strong><mark id="kb-first-match" class="rounded-sm bg-accent-2/30 px-0.5 text-foreground">save</mark></strong> then <em>exit</em>"`,
    );
  });

  it("renders plain text without wrapping tags", () => {
    const html = renderToStaticMarkup(<>{renderInlineMarkdown("just plain text", [], { n: 0 })}</>);
    expect(html).toMatchInlineSnapshot(`"just plain text"`);
  });
});
