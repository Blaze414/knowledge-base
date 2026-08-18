import type { SearchCorpus } from "@/lib/kb-search";

export const KB_SEARCH_REINDEX_EVENT = "kb:content-changed";

export interface KnowledgeBaseReindexDetail {
  reason: string;
  requestedAt: number;
  /**
   * Optional replacement snapshot supplied by a live CMS. Static content
   * updates can omit this because Vite/build imports the latest catalogue.
   */
  corpus?: SearchCorpus | null;
}

/**
 * Notify the live search index that an article or registry changed.
 * A future CMS can call this after applying a create, update, or delete.
 * Repeated calls are debounced by `useKbSearch`.
 */
export function requestKnowledgeBaseReindex(
  reason = "content-update",
  corpus?: SearchCorpus | null,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<KnowledgeBaseReindexDetail>(KB_SEARCH_REINDEX_EVENT, {
      detail: { reason, requestedAt: Date.now(), ...(corpus !== undefined ? { corpus } : {}) },
    }),
  );
}
