/**
 * Minimal inline-markdown renderer for use inside callout bodies (and
 * other small prose contexts). Supports `**bold**` and `*emphasis*` only —
 * block-level markdown is handled elsewhere by `formatContent`.
 *
 * Search-term highlighting is preserved by routing every plain-text
 * segment through `highlightText`, so a search match that lands inside a
 * bolded word still renders a <mark>.
 */
import React from "react";
import { Link } from "@tanstack/react-router";
import { highlightText } from "@/components/kb-highlight";

export type InlineSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "em"; text: string }
  | { kind: "link"; text: string; href: string };

/**
 * Defense-in-depth sanitizer for inline-markdown text. React already
 * escapes string children when rendering, so a literal `<script>` in user
 * content is never executed. We additionally strip the angle brackets that
 * delimit HTML tags so that even downstream consumers that might treat the
 * text as HTML (copy-paste into innerHTML, server-rendered markup that is
 * later re-parsed, etc.) cannot resurrect a tag. This is intentionally
 * conservative — we only allow `**bold**` and `*emphasis*`; anything that
 * looks like an HTML tag is dropped wholesale.
 */
export function sanitizeInlineText(text: string): string {
  // Remove anything that looks like an HTML/XML tag, including unmatched
  // `<` or `>` characters. We do this before segment parsing so the bold/em
  // regex never has to deal with angle brackets.
  return text.replace(/<\/?[a-zA-Z][^>]*>?/g, "").replace(/[<>]/g, "");
}

/**
 * Hard cap on the length of a single inline-markdown string we are willing
 * to parse. Author content is short prose (callouts, paragraphs, list
 * items); anything larger than this is almost certainly accidental (a
 * giant pasted blob) or hostile (an attempt to make the regex engine do
 * pathological work). We truncate before sanitizing/parsing so both the
 * tag-stripper and the bold/em scanner stay O(n) on a bounded n.
 */
export const INLINE_MD_MAX_LENGTH = 10_000;

/** Visible marker appended when input is truncated, so authors notice. */
export const INLINE_MD_TRUNCATION_MARKER = "…";

function clampInlineInput(text: string): string {
  if (text.length <= INLINE_MD_MAX_LENGTH) return text;
  return text.slice(0, INLINE_MD_MAX_LENGTH) + INLINE_MD_TRUNCATION_MARKER;
}

// Link first so `[text](url)` is consumed before bold/em scanning.
// Then bold (greedier delimiter wins) so `**foo**` isn't eaten as two
// italic runs. Inner text must not contain the delimiter character.
const INLINE_RE =
  /\[([^\]\n\u2028\u2029]+)\]\(([^)\s\n\u2028\u2029]+)\)|\*\*([^*\n\u2028\u2029]+)\*\*|\*([^*\n\u2028\u2029]+)\*/g;

/**
 * Split a string into plain / bold / emphasis segments. Unmatched `*`
 * characters stay as literal text. Input is sanitized first to strip any
 * HTML-looking tokens (see `sanitizeInlineText`) and clamped to
 * `INLINE_MD_MAX_LENGTH` to keep parsing bounded.
 */
export function parseInlineSegments(text: string): InlineSegment[] {
  const safe = sanitizeInlineText(clampInlineInput(text));
  const out: InlineSegment[] = [];
  let last = 0;
  INLINE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(safe))) {
    if (m.index > last) {
      out.push({ kind: "text", text: safe.slice(last, m.index) });
    }
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push({ kind: "link", text: m[1], href: m[2] });
    } else if (m[3] !== undefined) {
      out.push({ kind: "bold", text: m[3] });
    } else if (m[4] !== undefined) {
      out.push({ kind: "em", text: m[4] });
    }
    last = m.index + m[0].length;
  }
  if (last < safe.length) {
    out.push({ kind: "text", text: safe.slice(last) });
  }
  return out;
}

/**
 * Render a string of inline markdown into React nodes, preserving search
 * highlight marks supplied via `stems` + `counter` (same contract as
 * `highlightText`).
 */
export function renderInlineMarkdown(
  text: string,
  stems: string[],
  counter: { n: number },
): React.ReactNode {
  const segments = parseInlineSegments(text);
  return segments.map((seg, i) => {
    const inner = highlightText(seg.text, stems, counter);
    if (seg.kind === "bold") return <strong key={i}>{inner}</strong>;
    if (seg.kind === "em") return <em key={i}>{inner}</em>;
    if (seg.kind === "link") return renderLink(seg.href, inner, i);
    return <React.Fragment key={i}>{inner}</React.Fragment>;
  });
}

/**
 * Render a link segment. Internal knowledge-base links of the form
 * `/?page=<id>` use TanStack Router's `<Link>` so navigation stays
 * client-side and preserves other search params via the function form.
 * Everything else falls back to a plain anchor (external links open in a
 * new tab with `rel="noopener noreferrer"`).
 */
function renderLink(href: string, children: React.ReactNode, key: number) {
  const kbLink = parseKbPageHref(href);
  const className = "text-primary underline-offset-4 hover:underline focus-visible:underline";
  if (href.startsWith("#")) {
    const targetId = href.slice(1);
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!targetId) return;
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof history !== "undefined" && history.replaceState) {
          history.replaceState(null, "", `#${targetId}`);
        }
      }
    };
    return (
      <a key={key} href={href} className={className} onClick={handleClick}>
        {children}
      </a>
    );
  }
  if (kbLink) {
    return (
      <Link
        key={key}
        to="/"
        search={(prev: Record<string, unknown>) => ({ ...prev, page: kbLink })}
        className={className}
      >
        {children}
      </Link>
    );
  }
  const isExternal = /^(https?:)?\/\//i.test(href);
  if (isExternal) {
    return (
      <a
        key={key}
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer nofollow external"
        aria-label={typeof children === "string" ? `${children} (opens in a new tab)` : undefined}
      >
        {children}
        <span aria-hidden="true"> ↗</span>
      </a>
    );
  }
  return (
    <a key={key} href={href} className={className}>
      {children}
    </a>
  );
}

function parseKbPageHref(href: string): string | null {
  // Accept `/?page=foo` or `?page=foo` (with optional extra params).
  const m = href.match(/^\/?\?(.*)$/);
  if (!m) return null;
  const params = new URLSearchParams(m[1]);
  const page = params.get("page");
  return page && /^[\w-]+$/.test(page) ? page : null;
}
