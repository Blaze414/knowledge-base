import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KbCallout, parseCallout } from "./kb-callout";

describe("parseCallout", () => {
  it("parses a NOTE callout", () => {
    expect(parseCallout("> [!NOTE] Heads up")).toEqual({
      kind: "NOTE",
      text: "Heads up",
    });
  });

  it("parses a WARNING callout (case-insensitive)", () => {
    expect(parseCallout("> [!warning] Be careful")).toEqual({
      kind: "WARNING",
      text: "Be careful",
    });
  });

  it("ignores plain quoted lines and other markdown", () => {
    expect(parseCallout("> just a quote")).toBeNull();
    expect(parseCallout("## A heading")).toBeNull();
    expect(parseCallout("")).toBeNull();
  });
});

describe("KbCallout snapshots", () => {
  it("renders a NOTE callout", () => {
    const html = renderToStaticMarkup(
      <KbCallout kind="NOTE">Heads up, this is informational.</KbCallout>,
    );
    expect(html).toMatchInlineSnapshot(
      `"<div role="note" aria-label="Note" class="body my-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-foreground shadow-panel-soft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg><div class="min-w-0"><span class="h6 block text-primary">Note</span><div class="body block space-y-2 text-foreground/85">Heads up, this is informational.</div></div></div>"`,
    );
  });

  it("renders a WARNING callout", () => {
    const html = renderToStaticMarkup(
      <KbCallout kind="WARNING">This action cannot be undone.</KbCallout>,
    );
    expect(html).toMatchInlineSnapshot(
      `"<div role="note" aria-label="Warning" class="body my-4 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-foreground shadow-panel-soft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div class="min-w-0"><span class="h6 block text-destructive">Warning</span><div class="body block space-y-2 text-foreground/85">This action cannot be undone.</div></div></div>"`,
    );
  });
});

import {
  consolidateCallouts,
  splitCalloutLines,
  parseCallout as parseCalloutFn,
  CALLOUT_LINE_SEP,
} from "./kb-callout";

describe("consolidateCallouts (multi-line)", () => {
  it("merges continuation lines into an inline callout body", () => {
    const input = [
      "Intro paragraph.",
      "",
      "> [!NOTE] First line of note",
      "second line still in the note",
      "third line still in the note",
      "",
      "",
      "Next paragraph.",
    ].join("\n");
    const out = consolidateCallouts(input);
    const calloutLine = out.split("\n").find((l) => l.startsWith("> [!NOTE]"))!;
    expect(splitCalloutLines(parseCalloutFn(calloutLine)!.text)).toEqual([
      "First line of note",
      "second line still in the note",
      "third line still in the note",
    ]);
    // Paragraphs around the callout are preserved.
    expect(out).toContain("Intro paragraph.");
    expect(out).toContain("Next paragraph.");
  });

  it("supports an inline callout with empty first-line body", () => {
    const input = [
      "> [!WARNING]",
      "body lives entirely on the next lines",
      "and continues here",
      "",
      "",
      "After.",
    ].join("\n");
    const out = consolidateCallouts(input);
    const parsed = parseCalloutFn(out.split("\n")[0])!;
    expect(parsed.kind).toBe("WARNING");
    expect(splitCalloutLines(parsed.text)).toEqual([
      "body lives entirely on the next lines",
      "and continues here",
    ]);
  });

  it("extends a registry override across multiple lines when `:` is present", () => {
    const input = [
      "[note:back-up-first]: First line of override",
      "second line of override",
      "",
      "",
      "After.",
    ].join("\n");
    const out = consolidateCallouts(input);
    const firstLine = out.split("\n")[0];
    // The override text is kept on the same source line, joined by the
    // line separator; `splitCalloutLines` reconstructs the segments.
    expect(firstLine).toContain(CALLOUT_LINE_SEP);
    const segments = firstLine.replace(/^\[note:[\w-]+\]:\s*/, "").split(CALLOUT_LINE_SEP);
    expect(segments).toEqual(["First line of override", "second line of override"]);
  });

  it("does NOT consume continuation lines for a bare `[note:key]` token", () => {
    const input = ["[note:back-up-first]", "this paragraph is not part of the callout", ""].join(
      "\n",
    );
    const out = consolidateCallouts(input);
    expect(out.split("\n")[0]).toBe("[note:back-up-first]");
    expect(out.split("\n")[1]).toBe("this paragraph is not part of the callout");
  });

  it("stops continuation at headings, list items, and other tokens", () => {
    const stoppers = [
      ["## Heading", "## Heading"],
      ["- a list item", "- a list item"],
      ["1. ordered item", "1. ordered item"],
      ["[doc:standards-overview]", "[doc:standards-overview]"],
      ["> [!NOTE] another callout", "> [!NOTE] another callout"],
    ] as const;
    for (const [stopper] of stoppers) {
      const input = ["> [!NOTE] first", "continuation", stopper, "after"].join("\n");
      const out = consolidateCallouts(input).split("\n");
      // First line holds the consolidated callout (first + continuation only).
      const calloutText = parseCalloutFn(out[0])!.text;
      expect(splitCalloutLines(calloutText)).toEqual(["first", "continuation"]);
      // Stopper begins on the next line (it may itself open a new block,
      // e.g. a second `> [!NOTE]` that consumes the trailing "after").
      expect(out[1].startsWith(stopper)).toBe(true);
    }
  });
});

import { splitCalloutParagraphs, CALLOUT_PARA_SEP } from "./kb-callout";

describe("splitCalloutParagraphs", () => {
  it("splits paragraphs and preserves hard line breaks within each", () => {
    const text = `p1-line1${CALLOUT_LINE_SEP}p1-line2${CALLOUT_PARA_SEP}p2-line1`;
    expect(splitCalloutParagraphs(text)).toEqual([["p1-line1", "p1-line2"], ["p2-line1"]]);
  });

  it("returns a single paragraph when there are no paragraph breaks", () => {
    expect(splitCalloutParagraphs("just one line")).toEqual([["just one line"]]);
  });
});

describe("consolidateCallouts (paragraphs)", () => {
  it("treats a single blank line inside a callout as a paragraph break", () => {
    const input = [
      "> [!NOTE] First paragraph line one",
      "first paragraph line two",
      "",
      "Second paragraph line one",
      "second paragraph line two",
      "",
      "",
      "After (outside the callout).",
    ].join("\n");
    const out = consolidateCallouts(input);
    const calloutLine = out.split("\n").find((l) => l.startsWith("> [!NOTE]"))!;
    const parsed = parseCalloutFn(calloutLine)!;
    expect(splitCalloutParagraphs(parsed.text)).toEqual([
      ["First paragraph line one", "first paragraph line two"],
      ["Second paragraph line one", "second paragraph line two"],
    ]);
    // The double blank line terminates the callout and the trailing
    // paragraph remains in the output.
    expect(out).toContain("After (outside the callout).");
  });

  it("terminates the callout on a double blank line without consuming text after", () => {
    const input = ["> [!WARNING] Heads up", "", "", "Plain paragraph after the callout."].join(
      "\n",
    );
    const out = consolidateCallouts(input);
    const parsed = parseCalloutFn(out.split("\n")[0])!;
    expect(splitCalloutParagraphs(parsed.text)).toEqual([["Heads up"]]);
    expect(out).toContain("Plain paragraph after the callout.");
  });
});

describe("KbCallout multiline snapshots", () => {
  it("renders <br /> for hard line breaks within a single paragraph", () => {
    const html = renderToStaticMarkup(
      <KbCallout kind="NOTE">
        <p>
          line one
          <br />
          line two
          <br />
          line three
        </p>
      </KbCallout>,
    );
    expect(html).toMatchInlineSnapshot(
      `"<div role="note" aria-label="Note" class="body my-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-foreground shadow-panel-soft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg><div class="min-w-0"><span class="h6 block text-primary">Note</span><div class="body block space-y-2 text-foreground/85"><p>line one<br/>line two<br/>line three</p></div></div></div>"`,
    );
  });

  it("renders separate <p> blocks for paragraph breaks", () => {
    const html = renderToStaticMarkup(
      <KbCallout kind="WARNING">
        <p>First paragraph.</p>
        <p>
          Second paragraph line one
          <br />
          second paragraph line two
        </p>
      </KbCallout>,
    );
    expect(html).toMatchInlineSnapshot(
      `"<div role="note" aria-label="Warning" class="body my-4 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-foreground shadow-panel-soft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div class="min-w-0"><span class="h6 block text-destructive">Warning</span><div class="body block space-y-2 text-foreground/85"><p>First paragraph.</p><p>Second paragraph line one<br/>second paragraph line two</p></div></div></div>"`,
    );
  });
});

import { renderInlineMarkdown } from "@/lib/inline-md";

describe("KbCallout inline markdown snapshots", () => {
  it("renders bold and italic across multiple paragraphs", () => {
    const counter = { n: 0 };
    const text = `First paragraph with **bold** word.${CALLOUT_PARA_SEP}Second paragraph with *italic* word and${CALLOUT_LINE_SEP}a hard break.`;
    const html = renderToStaticMarkup(
      <KbCallout kind="NOTE">
        {splitCalloutParagraphs(text).map((segments, p) => (
          <p key={p}>
            {segments.map((seg, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {renderInlineMarkdown(seg, [], counter)}
              </React.Fragment>
            ))}
          </p>
        ))}
      </KbCallout>,
    );
    expect(html).toMatchInlineSnapshot(
      `"<div role="note" aria-label="Note" class="body my-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-foreground shadow-panel-soft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg><div class="min-w-0"><span class="h6 block text-primary">Note</span><div class="body block space-y-2 text-foreground/85"><p>First paragraph with <strong>bold</strong> word.</p><p>Second paragraph with <em>italic</em> word and<br/>a hard break.</p></div></div></div>"`,
    );
  });
});

import React from "react";
