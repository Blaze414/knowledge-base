/**
 * Live knowledge-base search hook.
 *
 * Wraps the pure helpers in `src/lib/kb-search.ts` with the React state
 * needed to keep results reactive:
 *   - tokenizes the active query
 *   - rebuilds the Fuse index when the article corpus changes (debounced)
 *   - returns filtered sidebar categories with match metadata
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  buildSearchableRecords,
  computeContentSignature,
  createFuse,
  searchSidebar,
  tokenize,
  type SearchCorpus,
  type SidebarCategoryResult,
} from "@/lib/kb-search";
import { searchKnowledgeBase, type SmartSearchResponse } from "@/lib/smart-search";
import {
  KB_SEARCH_REINDEX_EVENT,
  requestKnowledgeBaseReindex,
  type KnowledgeBaseReindexDetail,
} from "@/lib/kb-search-events";

export interface UseKbSearchResult {
  tokens: string[];
  filteredCategories: SidebarCategoryResult[];
  smartSearch: SmartSearchResponse;
  searching: boolean;
  indexing: boolean;
  corpusSignature: string;
}

export function useKbSearch(
  searchQuery: string,
  { reindexDebounceMs = 300 }: { reindexDebounceMs?: number } = {},
): UseKbSearchResult {
  const tokens = useMemo(() => tokenize(searchQuery), [searchQuery]);
  const deferredQuery = useDeferredValue(searchQuery);
  const [sourceRevision, setSourceRevision] = useState(0);
  const [indexedRevision, setIndexedRevision] = useState(0);
  const [liveCorpus, setLiveCorpus] = useState<SearchCorpus | null>(null);

  useEffect(() => {
    const bumpRevision = () => setSourceRevision((revision) => revision + 1);
    const requestReindex = (event: Event) => {
      const detail = (event as CustomEvent<KnowledgeBaseReindexDetail>).detail;
      if (detail && Object.prototype.hasOwnProperty.call(detail, "corpus")) {
        setLiveCorpus(detail.corpus ?? null);
      }
      bumpRevision();
    };
    window.addEventListener(KB_SEARCH_REINDEX_EVENT, requestReindex);
    const hot = import.meta.hot;
    hot?.on("vite:afterUpdate", bumpRevision);
    return () => {
      window.removeEventListener(KB_SEARCH_REINDEX_EVENT, requestReindex);
      hot?.off("vite:afterUpdate", bumpRevision);
    };
  }, []);

  // Debounce reindexing so a burst of HMR/article edits collapses into one
  // rebuild after things settle.
  useEffect(() => {
    if (indexedRevision === sourceRevision) return;
    const id = window.setTimeout(() => {
      setIndexedRevision(sourceRevision);
    }, reindexDebounceMs);
    return () => window.clearTimeout(id);
  }, [indexedRevision, reindexDebounceMs, sourceRevision]);

  const searchableRecords = useMemo(
    () => buildSearchableRecords(liveCorpus ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indexedRevision, liveCorpus],
  );
  const corpusSignature = useMemo(
    () => computeContentSignature(searchableRecords),
    [searchableRecords],
  );

  const fuse = useMemo(() => createFuse(searchableRecords), [searchableRecords]);

  const filteredCategories = useMemo(
    () => searchSidebar(searchQuery, tokens, fuse),
    [searchQuery, tokens, fuse],
  );
  const smartSearch = useMemo(
    () => searchKnowledgeBase(deferredQuery, searchableRecords, fuse),
    [deferredQuery, fuse, searchableRecords],
  );

  const searching = searchQuery.trim().length > 0;
  const indexing = indexedRevision !== sourceRevision || deferredQuery !== searchQuery;

  return {
    tokens,
    filteredCategories,
    smartSearch,
    searching,
    indexing,
    corpusSignature,
  };
}

export { requestKnowledgeBaseReindex };
