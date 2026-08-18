#!/usr/bin/env node
/**
 * Audit hardcoded color usages that bypass the design-token system.
 *
 * Flags Tailwind palette utilities for branded color families (sky, indigo,
 * fuchsia, emerald, amber, violet, etc.) and arbitrary `bg-[oklch(...)]`,
 * `text-[#...]`, `border-[hsl(...)]` values inside src/**.
 *
 * Allowlist: anything inside src/components/ui/ (shadcn primitives, kept
 * verbatim), src/styles.css (token definitions), and src/lib/error-page.ts
 * (standalone inline HTML used outside the React tree).
 *
 * Usage:
 *   bun run audit:colors        # exit 1 on findings
 *   bun run audit:colors --json # machine-readable output
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".cache"]);
const IGNORE_PATHS = [
  `src${sep}components${sep}ui${sep}`,
  `src${sep}styles.css`,
  `src${sep}lib${sep}error-page.ts`,
  `src${sep}routeTree.gen.ts`,
];

// Tailwind palette families that should never appear directly — use semantic
// tokens (primary, accent, accent-2, muted, …) instead.
const BANNED_PALETTES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const RULES = [
  {
    id: "tailwind-palette-class",
    description:
      "Tailwind palette utility — use a semantic token (primary, accent, accent-2, muted, …) instead.",
    // Match utility prefixes that take a color value (bg, text, border, ring, from, to, via,
    // decoration, divide, outline, fill, stroke, shadow, placeholder, accent, caret) followed
    // by `-<family>-<shade>` (e.g. `text-sky-500`, `from-indigo-400/30`).
    regex: new RegExp(
      String.raw`\b(bg|text|border|ring|from|via|to|decoration|divide|outline|fill|stroke|shadow|placeholder|accent|caret)-(` +
        BANNED_PALETTES.join("|") +
        String.raw`)-\d{2,3}(\/\d{1,3})?\b`,
      "g",
    ),
  },
  {
    id: "arbitrary-color-value",
    description:
      "Arbitrary color value in a utility — promote to a CSS variable in src/styles.css.",
    // Matches `bg-[oklch(...)]`, `text-[#abc]`, `border-[hsl(...)]`, `text-[rgb(...)]`, etc.
    regex:
      /\b(?:bg|text|border|ring|from|via|to|decoration|divide|outline|fill|stroke|shadow|placeholder|accent|caret)-\[(?:#[0-9a-fA-F]{3,8}|(?:oklch|hsla?|rgba?|color)\([^\]]+)\]/g,
  },
];

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx"]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function isIgnored(rel) {
  return IGNORE_PATHS.some((p) => rel.startsWith(p));
}

const findings = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (isIgnored(rel)) continue;
  const ext = file.slice(file.lastIndexOf("."));
  if (!EXTS.has(ext)) continue;

  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(line)) !== null) {
        findings.push({
          file: rel,
          line: i + 1,
          column: m.index + 1,
          rule: rule.id,
          match: m[0],
          snippet: line.trim(),
        });
      }
    }
  });
}

const json = process.argv.includes("--json");
if (json) {
  process.stdout.write(JSON.stringify({ count: findings.length, findings }, null, 2) + "\n");
} else if (findings.length === 0) {
  console.log("✓ No hardcoded color classes found. Design tokens look consistent.");
} else {
  console.error(
    `✗ Found ${findings.length} hardcoded color usage${findings.length === 1 ? "" : "s"}:\n`,
  );
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}:${f.column}  [${f.rule}]`);
    console.error(`    ${f.match}`);
    console.error(`    ↳ ${f.snippet}\n`);
  }
  console.error(
    "Replace with a semantic token from src/styles.css (--primary, --accent, --accent-2, --muted, …).",
  );
}

process.exit(findings.length === 0 ? 0 : 1);
