/**
 * Central registry of downloadable reference documents used in the
 * knowledge base. Reference them from article content with a token on
 * its own line:
 *
 *     [doc:standards-overview]
 *
 * `href` can be a path under /public, a Lovable CDN asset, or any
 * external URL. `size` is a human-readable string ("482 KB").
 */
export interface DocRef {
  name: string;
  href: string;
  description?: string;
  /** Lowercase extension shown as a badge, e.g. "pdf", "csv", "md". */
  kind?: string;
  size?: string;
  /** Suggested filename when downloaded; defaults to last path segment. */
  filename?: string;
}

export const documents = {
  "standards-overview": {
    name: "The Beagle Code — Overview",
    href: "/docs/rto-standards-2025-overview.md",
    description: "Concise reference of Snoopy's official beagle conduct code.",
    kind: "md",
    size: "1 KB",
    filename: "beagle-code-overview.md",
  },
  "validation-checklist": {
    name: "Suppertime Checklist",
    href: "/docs/validation-checklist.csv",
    description: "Spreadsheet template covering each suppertime ritual.",
    kind: "csv",
    size: "1 KB",
    filename: "suppertime-checklist.csv",
  },
} as const satisfies Record<string, DocRef>;

export type DocKey = keyof typeof documents;

export function getDocument(key: string): DocRef | undefined {
  return (documents as Record<string, DocRef>)[key];
}
