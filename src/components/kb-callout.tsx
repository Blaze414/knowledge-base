import React from "react";
import { Info, AlertTriangle } from "lucide-react";

export type CalloutKind = "NOTE" | "WARNING";

/**
 * Internal separator used to preserve multi-line callout bodies once
 * `consolidateCallouts` collapses them onto a single source line. The
 * Unicode Line Separator never appears in author content, so it's a
 * safe sentinel that survives further string splitting.
 */
export const CALLOUT_LINE_SEP = "\u2028";

/**
 * Paragraph-level separator inside a consolidated callout body. A single
 * blank line in the source becomes one of these; rendering wraps each
 * paragraph in its own block.
 */
export const CALLOUT_PARA_SEP = "\u2029";

/**
 * Renders a styled inline callout used inside knowledge-base articles.
 * Source syntax (one line): `> [!NOTE] text` or `> [!WARNING] text`.
 */
export const KbCallout: React.FC<{
  kind: CalloutKind;
  children: React.ReactNode;
}> = ({ kind, children }) => {
  const isWarning = kind === "WARNING";
  const Icon = isWarning ? AlertTriangle : Info;
  return (
    <div
      role="note"
      aria-label={isWarning ? "Warning" : "Note"}
      className={
        isWarning
          ? "body my-4 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-foreground shadow-panel-soft"
          : "body my-4 flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-foreground shadow-panel-soft"
      }
    >
      <Icon
        className={
          isWarning
            ? "mt-0.5 h-4 w-4 shrink-0 text-destructive"
            : "mt-0.5 h-4 w-4 shrink-0 text-primary"
        }
        aria-hidden="true"
      />
      <div className="min-w-0">
        <span className={isWarning ? "h6 block text-destructive" : "h6 block text-primary"}>
          {isWarning ? "Warning" : "Note"}
        </span>
        <div className="body block space-y-2 text-foreground/85">{children}</div>
      </div>
    </div>
  );
};

// Allow an empty body so callouts whose text lives entirely on continuation
// lines (joined by CALLOUT_LINE_SEP) still parse. The `s` flag lets `.`
// match the line separator.
const CALLOUT_RE = /^>\s*\[!(NOTE|WARNING)\](?:\s+(.+))?$/is;

/**
 * If `line` is a callout token, return its kind and text; otherwise null.
 * `text` may contain CALLOUT_LINE_SEP when consolidated from a multi-line
 * block; render it with `splitCalloutLines` to display real line breaks.
 */
export function parseCallout(line: string): { kind: CalloutKind; text: string } | null {
  const m = line.trim().match(CALLOUT_RE);
  if (!m) return null;
  return {
    kind: m[1].toUpperCase() as CalloutKind,
    text: m[2] ?? "",
  };
}

/**
 * Split a (possibly consolidated) callout body into rendering segments.
 * Each segment becomes a separate visual line; render with `<br />` between.
 */
export function splitCalloutLines(text: string): string[] {
  return text.split(CALLOUT_LINE_SEP);
}

/**
 * Split a consolidated callout body into paragraphs, where each paragraph
 * is an array of line segments (separated by hard line breaks).
 *
 *   "a\u2028b\u2029c"  →  [["a", "b"], ["c"]]
 */
export function splitCalloutParagraphs(text: string): string[][] {
  return text.split(CALLOUT_PARA_SEP).map(splitCalloutLines);
}

// Matches lines we treat as continuation-stoppers (headings, list items,
// other tokens, other callouts). Anything else non-empty is consumed as
// continuation text for the active callout.
const STOPPER_RE =
  /^(?:#|[-*]\s|\d+\.\s|>\s*\[!(?:NOTE|WARNING)\]|\[(?:video|image|doc|note|warn|warning):[\w-]+\])/i;

const INLINE_START_RE = /^>\s*\[!(?:NOTE|WARNING)\]/i;
const REGISTRY_OVERRIDE_RE = /^\[(?:note|warn|warning):[\w-]+\]:/i;

/**
 * Walk article content and merge each callout token line with its
 * continuation lines (until a blank line, heading, list item, or another
 * token) into a single line, joined by CALLOUT_LINE_SEP. Other lines are
 * left untouched.
 *
 * Continuation is enabled for:
 *   - inline callouts: `> [!NOTE] text...` (body may be empty on line 1)
 *   - registry callouts WITH an explicit override marker: `[note:key]: text`
 *
 * A registry token without `:` (`[note:key]`) renders the registry body as-is
 * and does NOT consume following lines.
 */
export function consolidateCallouts(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isInline = INLINE_START_RE.test(trimmed);
    const isRegistryOverride = REGISTRY_OVERRIDE_RE.test(trimmed);
    if (!isInline && !isRegistryOverride) {
      out.push(line);
      continue;
    }
    // First line stays as-is (preserves the token prefix). Continuation
    // lines are appended joined by CALLOUT_LINE_SEP; a single blank line
    // becomes a CALLOUT_PARA_SEP paragraph break and we keep going.
    // Two blank lines in a row (or a stopper line, or end of content)
    // terminates the callout.
    let buf = line.trimEnd();
    let pendingParaBreak = false;
    while (i + 1 < lines.length) {
      const next = lines[i + 1];
      const nextTrim = next.trim();
      if (nextTrim === "") {
        if (pendingParaBreak) {
          // Second consecutive blank line → end the callout. Do not
          // consume either blank line so the surrounding renderer still
          // sees the paragraph gap that follows.
          break;
        }
        pendingParaBreak = true;
        i++;
        continue;
      }
      if (STOPPER_RE.test(nextTrim)) break;
      buf += (pendingParaBreak ? CALLOUT_PARA_SEP : CALLOUT_LINE_SEP) + nextTrim;
      pendingParaBreak = false;
      i++;
    }
    out.push(buf);
  }
  return out.join("\n");
}
