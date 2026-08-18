import { describe, it, expect, beforeAll } from "vitest";
import fc from "fast-check";
import { renderToStaticMarkup } from "react-dom/server";
import { parseInlineSegments, renderInlineMarkdown, sanitizeInlineText } from "./inline-md";

/**
 * Property-based fuzz tests for the inline-markdown pipeline. The goal is
 * not to assert specific output shapes — those are covered by the unit
 * tests — but to prove two invariants hold for *any* input:
 *
 *   1. Parsing/sanitizing/rendering never throws.
 *   2. The rendered HTML never contains an author-supplied HTML element
 *      (only the `<strong>` and `<em>` wrappers we emit ourselves).
 *
 * We bias the generators toward inputs that have historically caused
 * problems: unbalanced `<`/`>`, attribute-laden tag fragments, long runs
 * of `*`, and mixtures of the two.
 *
 * Seed handling: the seed used by fast-check is read from the
 * `FUZZ_SEED` env var (falling back to `Date.now()`), logged on every
 * run, and — in CI — persisted to `$GITHUB_OUTPUT` / `$FUZZ_SEED_FILE`
 * so a failing CI job can be replayed locally with:
 *
 *     FUZZ_SEED=<seed> bun run test:fuzz:inline-md
 */

const FUZZ_SEED = (() => {
  const fromEnv = process.env.FUZZ_SEED;
  if (fromEnv && /^-?\d+$/.test(fromEnv)) return Number(fromEnv);
  return Date.now();
})();

/**
 * Iteration counts. CI sets `FUZZ_RUNS` / `FUZZ_PERF_RUNS` higher to use
 * the time freed up by dependency + Vite caching; local runs keep the
 * defaults so `bun run test:fuzz:inline-md` stays snappy.
 */
const NUM_RUNS = (() => {
  const v = Number(process.env.FUZZ_RUNS);
  return Number.isFinite(v) && v > 0 ? v : 500;
})();
const NUM_PERF_RUNS = (() => {
  const v = Number(process.env.FUZZ_PERF_RUNS);
  return Number.isFinite(v) && v > 0 ? v : 200;
})();

beforeAll(() => {
  fc.configureGlobal({ seed: FUZZ_SEED });
  // Visible in CI logs, the Vitest reporter, and any artifact tail.

  console.log(
    `[inline-md fuzz] seed=${FUZZ_SEED} runs=${NUM_RUNS} perfRuns=${NUM_PERF_RUNS} — replay with: FUZZ_SEED=${FUZZ_SEED} bun run test:fuzz:inline-md`,
  );
  // Best-effort persistence for CI: write to whichever sink is available.
  try {
    // Lazy-load fs so the browser/SSR environment never sees it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    const seedFile = process.env.FUZZ_SEED_FILE;
    if (seedFile) fs.writeFileSync(seedFile, String(FUZZ_SEED));
    const ghOut = process.env.GITHUB_OUTPUT;
    if (ghOut) fs.appendFileSync(ghOut, `seed=${FUZZ_SEED}\n`);
    const ghSummary = process.env.GITHUB_STEP_SUMMARY;
    if (ghSummary) {
      fs.appendFileSync(
        ghSummary,
        `### inline-md fuzz seed\n\n` +
          `\`${FUZZ_SEED}\`\n\n` +
          `Replay locally:\n\n` +
          "```sh\n" +
          `FUZZ_SEED=${FUZZ_SEED} bun run test:fuzz:inline-md\n` +
          "```\n",
      );
    }
  } catch {
    // Non-fatal — logging the seed is enough for replay.
  }
});

// Characters most likely to break the parser.
const SPICY = fc.constantFrom(
  "<",
  ">",
  "/",
  "*",
  "**",
  "***",
  '"',
  "'",
  "=",
  " ",
  "\n",
  "\t",
  "script",
  "img",
  "a",
  "b",
  "div",
  "onerror",
  "javascript:",
  "href",
  "alert(1)",
  "x",
  "&",
  "&lt;",
  "&gt;",
);

const tagSoup = fc.array(SPICY, { minLength: 0, maxLength: 60 }).map((parts) => parts.join(""));

const asteriskSoup = fc
  .array(
    fc.oneof(
      fc.constantFrom("*", "**", "***", "a", "b", " ", "\n"),
      fc.string({ minLength: 0, maxLength: 4 }),
    ),
    { minLength: 0, maxLength: 80 },
  )
  .map((parts) => parts.join(""));

const mixed = fc.oneof(
  tagSoup,
  asteriskSoup,
  fc.string({ minLength: 0, maxLength: 500 }),
  fc.tuple(tagSoup, asteriskSoup).map(([a, b]) => a + b),
);

/** A tag is `<` followed by a name-start char. Entity refs like `&lt;` are
 *  fine — we're checking the rendered HTML for *live* elements. */
const LIVE_TAG_RE = /<[a-zA-Z!/]/;

/** Tags the renderer is allowed to emit. */
const ALLOWED_TAG_RE = /^<\/?(?:strong|em|mark)\b/i;

function assertNoForeignTags(html: string) {
  // Walk every `<...>` occurrence and confirm it's one of ours.
  const re = /<[^>]*>?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!ALLOWED_TAG_RE.test(m[0])) {
      throw new Error(
        `Foreign tag leaked into output: ${JSON.stringify(m[0])} in ${JSON.stringify(html)}`,
      );
    }
  }
}

describe("inline-md fuzz", () => {
  it("sanitizeInlineText never leaves angle brackets behind", () => {
    fc.assert(
      fc.property(mixed, (input) => {
        const out = sanitizeInlineText(input);
        expect(out).not.toContain("<");
        expect(out).not.toContain(">");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("parseInlineSegments never throws and only emits known segment kinds", () => {
    fc.assert(
      fc.property(mixed, (input) => {
        const segs = parseInlineSegments(input);
        for (const seg of segs) {
          expect(["text", "bold", "em"]).toContain(seg.kind);
          // Segment text inherits sanitization — no brackets either.
          expect(seg.text).not.toContain("<");
          expect(seg.text).not.toContain(">");
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("renderInlineMarkdown never emits author-supplied HTML elements", () => {
    fc.assert(
      fc.property(mixed, (input) => {
        const html = renderToStaticMarkup(<>{renderInlineMarkdown(input, [], { n: 0 })}</>);
        // Either no live tags at all, or only our allow-listed wrappers.
        if (LIVE_TAG_RE.test(html)) {
          assertNoForeignTags(html);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("render stays bounded on pathological asterisk-heavy input", () => {
    fc.assert(
      fc.property(asteriskSoup, (input) => {
        const start = Date.now();
        renderToStaticMarkup(<>{renderInlineMarkdown(input, [], { n: 0 })}</>);
        expect(Date.now() - start).toBeLessThan(250);
      }),
      { numRuns: NUM_PERF_RUNS },
    );
  });
});
