import type Fuse from "fuse.js";
import {
  buildSnippet,
  countTokenHits,
  createFuse,
  tokenize,
  type SearchableRecord,
} from "@/lib/kb-search";

export type SearchConfidence = "high" | "medium" | "low" | "none";
export type SmartSearchStatus = "idle" | "results" | "low-confidence" | "no-results";

export interface SmartSearchResult {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  snippet: string | null;
  score: number;
  confidence: SearchConfidence;
  confidenceScore: number;
  highlightTokens: string[];
  matchReasons: string[];
}

export interface SmartSearchResponse {
  query: string;
  status: SmartSearchStatus;
  bestMatch: SmartSearchResult | null;
  related: SmartSearchResult[];
  suggestions: string[];
  expandedTokens: string[];
  isSpellingTolerantMatch: boolean;
}

export type SearchResultBadge = "Best match" | "Strong match" | "Relevant" | "Possible match";

export function getSearchResultBadge(
  result: Pick<SmartSearchResult, "confidence" | "score">,
  isBestMatch = false,
  bestScore?: number,
  rank = 2,
): SearchResultBadge {
  if (isBestMatch) return "Best match";
  const relativeScore = bestScore && bestScore > 0 ? result.score / bestScore : 1;
  if (result.confidence === "high" && relativeScore >= 0.65 && rank <= 3) return "Strong match";
  if (result.confidence !== "low" && relativeScore >= 0.35) return "Relevant";
  return "Possible match";
}

export const DEFAULT_SEARCH_SUGGESTIONS = [
  "Where is my order?",
  "How do I return an item?",
  "Why is my coupon not working?",
  "How can I contact customer support?",
] as const;

const SYNONYM_GROUPS = [
  ["buy", "order", "purchase", "shop"],
  ["parcel", "package", "shipment"],
  ["arrive", "arrival", "delivery", "shipping"],
  ["track", "tracking", "status"],
  ["return", "send-back", "exchange"],
  ["refund", "reimbursement", "money-back"],
  ["coupon", "discount", "promo", "promotion"],
  ["login", "sign-in", "password", "account"],
  ["damaged", "broken", "faulty"],
  ["size", "sizing", "fit", "measure"],
  ["gift", "present", "recipient"],
  ["contact", "support", "help", "assistance"],
  ["cancel", "change", "edit", "modify"],
  ["unavailable", "out-of-stock", "restock"],
  ["choose", "select", "correct", "right"],
] as const;

const synonymMap = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const stems = group.flatMap((term) => tokenize(term));
  for (const token of stems) {
    const synonyms = synonymMap.get(token) ?? new Set<string>();
    for (const candidate of stems) {
      if (candidate !== token) synonyms.add(candidate);
    }
    synonymMap.set(token, synonyms);
  }
}

const INTENT_RULES: Array<{ pattern: RegExp; terms: string[] }> = [
  {
    pattern:
      /where(?:'s| is).*(?:order|parcel|package)|(?:order|parcel|package).*(?:late|missing|arriv)/i,
    terms: ["tracking", "shipment", "delivery", "missing"],
  },
  {
    pattern: /(?:talk|speak|contact|reach).*(?:person|someone|support|service)/i,
    terms: ["contact", "customer", "support", "request"],
  },
  {
    pattern: /(?:money back|refund|send.*back|return.*item)/i,
    terms: ["return", "refund", "label"],
  },
  {
    pattern: /(?:coupon|promo|discount).*(?:fail|invalid|missing|not|won't|doesn't|work)/i,
    terms: ["coupon", "discount", "troubleshooting", "checkout"],
  },
  {
    pattern: /(?:forgot|reset).*(?:password|login)|can't.*(?:sign in|login)/i,
    terms: ["account", "password", "sign-in", "reset"],
  },
  {
    pattern: /(?:wrong|incorrect).*(?:item|product)|(?:damaged|broken).*(?:item|product)/i,
    terms: ["wrong-item", "damaged", "photos", "support"],
  },
  {
    pattern: /(?:phone|iphone|android).*(?:case|model)|(?:case).*(?:fit|compatible)/i,
    terms: ["phone-case", "model", "compatibility", "select"],
  },
];

interface ExpandedQuery {
  originalTokens: string[];
  expandedTokens: string[];
  intentTokens: string[];
  intentMatched: boolean;
}

export function expandSearchQuery(query: string): ExpandedQuery {
  const originalTokens = tokenize(query);
  const expanded = new Set(originalTokens);
  const intentTokens = new Set<string>();

  for (const token of originalTokens) {
    for (const synonym of synonymMap.get(token) ?? []) expanded.add(synonym);
  }

  let intentMatched = false;
  for (const rule of INTENT_RULES) {
    if (!rule.pattern.test(query)) continue;
    intentMatched = true;
    for (const term of rule.terms) {
      for (const token of tokenize(term)) {
        expanded.add(token);
        intentTokens.add(token);
      }
    }
  }

  return {
    originalTokens,
    expandedTokens: [...expanded],
    intentTokens: [...intentTokens],
    intentMatched,
  };
}

const SEARCH_FIELDS = [
  { key: "title" as const, label: "Title", weight: 12 },
  { key: "tags" as const, label: "Tags", weight: 9 },
  { key: "categoryName" as const, label: "Category", weight: 5 },
  { key: "docNames" as const, label: "Document", weight: 4 },
  { key: "imageAlts" as const, label: "Image", weight: 3 },
  { key: "slideshowMetadata" as const, label: "Slideshow", weight: 3 },
  { key: "videoNames" as const, label: "Video", weight: 2.5 },
  { key: "content" as const, label: "Article text", weight: 2 },
] as const;

const TYPO_FIELDS = SEARCH_FIELDS.filter((field) => field.key !== "content");

function tokenMatches(text: string, tokens: string[]): Set<string> {
  const matches = new Set<string>();
  for (const token of tokens) {
    if (countTokenHits(text, [token]) > 0) matches.add(token);
  }
  return matches;
}

export function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution =
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution,
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function typoTokenMatches(
  text: string,
  queryTokens: string[],
): Map<string, { term: string; similarity: number }> {
  const vocabulary = [...new Set(tokenize(text))];
  const matches = new Map<string, { term: string; similarity: number }>();
  for (const queryToken of queryTokens) {
    if (queryToken.length < 4 || vocabulary.includes(queryToken)) continue;
    const maxDistance = queryToken.length <= 5 ? 1 : queryToken.length <= 9 ? 2 : 3;
    let best: { term: string; similarity: number } | null = null;
    for (const term of vocabulary) {
      if (Math.abs(term.length - queryToken.length) > maxDistance) continue;
      const distance = editDistance(queryToken, term);
      if (distance > maxDistance) continue;
      const similarity = 1 - distance / Math.max(queryToken.length, term.length);
      if (!best || similarity > best.similarity) best = { term, similarity };
    }
    if (best && best.similarity >= 0.68) matches.set(queryToken, best);
  }
  return matches;
}

function normalisePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function confidenceLabel(value: number): SearchConfidence {
  if (value >= 0.72) return "high";
  if (value >= 0.46) return "medium";
  if (value >= 0.24) return "low";
  return "none";
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function cleanSnippetSource(text: string): string {
  return text
    .split(/\s+(?:#{1,6}\s*)?Sources?\b/i)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n#{1,6}\s+/g, ". ")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRelevantSnippet(record: SearchableRecord, tokens: string[]): string | null {
  const candidates = [
    record.content,
    record.docNames,
    record.imageAlts,
    record.slideshowMetadata,
    record.videoNames,
  ]
    .filter(Boolean)
    .map(cleanSnippetSource)
    .filter(Boolean);
  const source = candidates
    .map((text) => ({ text, hits: countTokenHits(text, tokens) }))
    .sort((a, b) => b.hits - a.hits)[0]?.text;
  return source ? buildSnippet(source, tokens) : null;
}

export function searchKnowledgeBase(
  query: string,
  records: SearchableRecord[],
  fuse: Fuse<SearchableRecord> = createFuse(records),
  { limit = 8 }: { limit?: number } = {},
): SmartSearchResponse {
  const trimmedQuery = query.trim();
  const expanded = expandSearchQuery(trimmedQuery);
  if (!trimmedQuery || expanded.originalTokens.length === 0) {
    return {
      query: trimmedQuery,
      status: "idle",
      bestMatch: null,
      related: [],
      suggestions: [...DEFAULT_SEARCH_SUGGESTIONS],
      expandedTokens: expanded.expandedTokens,
      isSpellingTolerantMatch: false,
    };
  }

  const expandedOnly = expanded.expandedTokens.filter(
    (token) => !expanded.originalTokens.includes(token),
  );
  const fuzzyHits = new Map<string, { quality: number; matchedQueries: Set<string> }>();
  const fuzzyQueries = [expanded.expandedTokens.join(" "), ...expanded.originalTokens]
    .map((value) => value.trim())
    .filter((value, index, all) => value.length >= 3 && all.indexOf(value) === index);
  for (const fuzzyQuery of fuzzyQueries) {
    for (const hit of fuse.search(fuzzyQuery)) {
      const quality = 1 - (hit.score ?? 1);
      const current = fuzzyHits.get(hit.item.id) ?? {
        quality: 0,
        matchedQueries: new Set<string>(),
      };
      current.quality = Math.max(current.quality, quality);
      if (quality >= 0.55 && fuzzyQuery !== fuzzyQueries[0]) {
        current.matchedQueries.add(fuzzyQuery);
      }
      fuzzyHits.set(hit.item.id, current);
    }
  }
  const normalizedQuery = normalisePhrase(trimmedQuery);

  const ranked = records
    .map(
      (
        record,
      ):
        | (SmartSearchResult & {
            fuzzyQuality: number;
            originalCoverage: number;
            typoCoverage: number;
          })
        | null => {
        const originalMatched = new Set<string>();
        const expandedMatched = new Set<string>();
        const typoMatched = new Map<string, { term: string; similarity: number; weight: number }>();
        const matchReasons: string[] = [];
        let weightedScore = 0;
        let titleCoverage = 0;
        let tagCoverage = 0;
        let semanticTitleCoverage = 0;
        let semanticTagCoverage = 0;

        for (const field of SEARCH_FIELDS) {
          const value = record[field.key];
          const originalFieldMatches = tokenMatches(value, expanded.originalTokens);
          const expandedFieldMatches = tokenMatches(value, expandedOnly);
          for (const token of originalFieldMatches) originalMatched.add(token);
          for (const token of expandedFieldMatches) expandedMatched.add(token);
          weightedScore += originalFieldMatches.size * field.weight;
          weightedScore += expandedFieldMatches.size * field.weight * 0.45;
          if (originalFieldMatches.size > 0 || expandedFieldMatches.size > 0) {
            matchReasons.push(field.label);
          }
          if (field.key === "title") {
            titleCoverage = originalFieldMatches.size / expanded.originalTokens.length;
            semanticTitleCoverage =
              expandedOnly.length > 0 ? expandedFieldMatches.size / expandedOnly.length : 0;
          }
          if (field.key === "tags") {
            tagCoverage = originalFieldMatches.size / expanded.originalTokens.length;
            semanticTagCoverage =
              expandedOnly.length > 0 ? expandedFieldMatches.size / expandedOnly.length : 0;
          }
        }

        for (const field of TYPO_FIELDS) {
          for (const [queryToken, match] of typoTokenMatches(
            record[field.key],
            expanded.originalTokens,
          )) {
            const current = typoMatched.get(queryToken);
            if (!current || match.similarity * field.weight > current.similarity * current.weight) {
              typoMatched.set(queryToken, { ...match, weight: field.weight });
            }
          }
        }
        if (typoMatched.size > 0) matchReasons.push("Spelling");

        const normalizedTitle = normalisePhrase(record.title);
        const exactTitlePhrase =
          normalizedQuery.length >= 3 && normalizedTitle.includes(normalizedQuery);
        if (exactTitlePhrase) weightedScore += normalizedTitle === normalizedQuery ? 28 : 18;

        const fuzzy = fuzzyHits.get(record.id);
        const fuzzyQuality = fuzzy?.quality ?? 0;
        const fuzzyCoverage = (fuzzy?.matchedQueries.size ?? 0) / expanded.originalTokens.length;
        const originalCoverage = originalMatched.size / expanded.originalTokens.length;
        const typoCoverage = typoMatched.size / expanded.originalTokens.length;
        const typoSimilarity =
          typoMatched.size > 0
            ? [...typoMatched.values()].reduce((total, match) => total + match.similarity, 0) /
              typoMatched.size
            : 0;
        const semanticCoverage =
          expandedOnly.length > 0 ? expandedMatched.size / expandedOnly.length : 0;

        if (weightedScore === 0 && fuzzyQuality === 0 && typoMatched.size === 0) return null;

        weightedScore += originalCoverage * 12;
        weightedScore += titleCoverage * 18;
        weightedScore += tagCoverage * 14;
        weightedScore += semanticCoverage * 5;
        weightedScore += semanticTitleCoverage * 16;
        weightedScore += semanticTagCoverage * 12;
        weightedScore += fuzzyCoverage * 8;
        weightedScore += fuzzyQuality * 8;
        weightedScore += [...typoMatched.values()].reduce(
          (total, match) => total + match.similarity * match.weight * 0.7,
          0,
        );
        if (expanded.intentMatched && semanticCoverage > 0) weightedScore += 5;

        let confidenceScore = clamp(
          originalCoverage * 0.4 +
            titleCoverage * 0.18 +
            tagCoverage * 0.1 +
            semanticCoverage * 0.18 +
            semanticTitleCoverage * 0.18 +
            semanticTagCoverage * 0.12 +
            fuzzyCoverage * 0.16 +
            fuzzyQuality * 0.12 +
            typoCoverage * 0.32 +
            typoSimilarity * 0.12 +
            (exactTitlePhrase ? 0.1 : 0) +
            (expanded.intentMatched && semanticCoverage > 0 ? 0.08 : 0),
        );
        if (originalCoverage === 0 && fuzzyQuality >= 0.55) {
          confidenceScore = Math.max(confidenceScore, fuzzyQuality * 0.65);
        }
        if (fuzzyCoverage > 0) {
          confidenceScore = Math.max(
            confidenceScore,
            clamp(fuzzyCoverage * 0.45 + fuzzyQuality * 0.25),
          );
        }
        if (typoCoverage > 0) {
          confidenceScore = Math.max(
            confidenceScore,
            clamp(originalCoverage * 0.3 + typoCoverage * 0.5 + typoSimilarity * 0.16),
          );
        }

        const correctedTokens = [...typoMatched.values()].map((match) => match.term);

        return {
          id: record.id,
          title: record.title,
          categoryId: record.categoryId,
          categoryName: record.categoryName,
          snippet: buildRelevantSnippet(record, expanded.expandedTokens),
          score: weightedScore,
          confidence: confidenceLabel(confidenceScore),
          confidenceScore,
          highlightTokens: [...new Set([...expanded.expandedTokens, ...correctedTokens])],
          matchReasons: [...new Set(matchReasons)],
          fuzzyQuality,
          originalCoverage,
          typoCoverage,
        };
      },
    )
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.confidenceScore - a.confidenceScore ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);

  const top = ranked[0];
  if (!top || top.confidence === "none") {
    return {
      query: trimmedQuery,
      status: "no-results",
      bestMatch: null,
      related: [],
      suggestions: [...DEFAULT_SEARCH_SUGGESTIONS],
      expandedTokens: expanded.expandedTokens,
      isSpellingTolerantMatch: false,
    };
  }

  const spellingTolerant =
    top.typoCoverage > 0 || (top.originalCoverage === 0 && top.fuzzyQuality >= 0.55);
  const cleanResults: SmartSearchResult[] = ranked
    .filter((result) => result.confidence !== "none")
    .map(
      ({
        fuzzyQuality: _fuzzyQuality,
        originalCoverage: _originalCoverage,
        typoCoverage: _typoCoverage,
        ...result
      }) => result,
    );

  if (top.confidence === "low") {
    return {
      query: trimmedQuery,
      status: "low-confidence",
      bestMatch: null,
      related: cleanResults.slice(0, 5),
      suggestions: cleanResults.slice(0, 3).map((result) => result.title),
      expandedTokens: expanded.expandedTokens,
      isSpellingTolerantMatch: spellingTolerant,
    };
  }

  return {
    query: trimmedQuery,
    status: "results",
    bestMatch: cleanResults[0],
    related: cleanResults.slice(1),
    suggestions: cleanResults.slice(0, 4).map((result) => result.title),
    expandedTokens: expanded.expandedTokens,
    isSpellingTolerantMatch: spellingTolerant,
  };
}
