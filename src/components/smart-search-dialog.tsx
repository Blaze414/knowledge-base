import { AlertCircle, ChevronRight, LoaderCircle, Search, Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { highlightInline } from "@/components/kb-highlight";
import {
  getSearchResultBadge,
  type SearchResultBadge,
  type SmartSearchResponse,
  type SmartSearchResult,
} from "@/lib/smart-search";

interface SmartSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  response: SmartSearchResponse;
  indexing: boolean;
  currentPageId?: string;
  onSelectArticle: (pageId: string) => void;
}

function SearchResultItem({
  result,
  current,
  isBestMatch = false,
  bestScore,
  rank,
  onSelect,
}: {
  result: SmartSearchResult;
  current: boolean;
  isBestMatch?: boolean;
  bestScore?: number;
  rank?: number;
  onSelect: () => void;
}) {
  const badge = getSearchResultBadge(result, isBestMatch, bestScore, rank);

  return (
    <CommandItem
      value={result.id}
      onSelect={onSelect}
      aria-current={current ? "page" : undefined}
      className="min-h-16 cursor-pointer items-start rounded-brand px-3 data-[selected=true]:bg-brand-sky-soft"
    >
      <Search className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="block min-w-0 flex-1 truncate font-medium text-foreground">
            {highlightInline(result.title, result.highlightTokens)}
          </span>
          <ResultBadge label={badge} />
          {current && <span className="small shrink-0 font-medium text-primary">Current</span>}
        </span>
        <span className="small mt-0.5 block text-muted-foreground">{result.categoryName}</span>
        {result.snippet && (
          <span className="small mt-1 line-clamp-2 block leading-relaxed text-muted-foreground">
            {highlightInline(result.snippet, result.highlightTokens)}
          </span>
        )}
        {result.matchReasons.length > 0 && (
          <span className="mt-1.5 block text-[0.6875rem] leading-4 text-muted-foreground/80">
            Matched in {result.matchReasons.slice(0, 3).join(", ").toLowerCase()}
          </span>
        )}
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </CommandItem>
  );
}

function ResultBadge({ label }: { label: SearchResultBadge }) {
  const tone =
    label === "Best match"
      ? "border-primary/30 bg-brand-sky-soft text-primary"
      : label === "Strong match"
        ? "border-foreground/15 bg-brand-surface-alt text-foreground"
        : "border-brand-hairline bg-brand-surface text-muted-foreground";

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] leading-4 font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

export function SmartSearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  response,
  indexing,
  currentPageId,
  onSelectArticle,
}: SmartSearchDialogProps) {
  const chooseArticle = (pageId: string) => {
    onOpenChange(false);
    onSelectArticle(pageId);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      commandProps={{ shouldFilter: false, loop: true }}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
        <span className="small inline-flex items-center gap-1.5 font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Smart search
        </span>
        <span className="text-[0.6875rem] text-muted-foreground">Private and on-device</span>
      </div>
      <CommandInput
        value={query}
        onValueChange={onQueryChange}
        placeholder="Ask a question or search articles"
        aria-label="Ask a question or search articles"
        className="h-14 pr-10 text-base"
      />
      <CommandList className="max-h-[min(64vh,460px)] p-2">
        {indexing && (
          <div
            role="status"
            className="small flex items-center gap-2 px-4 py-3 text-muted-foreground"
          >
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            Updating search results…
          </div>
        )}

        {!indexing && response.status === "idle" && (
          <CommandGroup heading="Try asking">
            {response.suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                value={`suggestion-${suggestion}`}
                onSelect={() => onQueryChange(suggestion)}
                className="min-h-11 cursor-pointer rounded-brand px-3 data-[selected=true]:bg-brand-sky-soft"
              >
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{suggestion}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!indexing && response.status === "no-results" && (
          <div className="px-4 py-7 text-center" role="status">
            <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="body mt-3 font-medium text-foreground">No reliable match found</p>
            <p className="small mx-auto mt-1 max-w-sm leading-relaxed text-muted-foreground">
              Try a shorter question, a product or order term, or one of these suggestions.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {response.suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onQueryChange(suggestion)}
                  className="small cursor-pointer rounded-full border border-brand-hairline bg-brand-surface px-3 py-1.5 text-foreground transition-colors hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!indexing && response.status === "low-confidence" && (
          <>
            <div className="mx-2 mb-2 rounded-brand border border-brand-hairline bg-brand-surface-alt px-3 py-2.5">
              <p className="small font-medium text-foreground">No strong match yet</p>
              <p className="small mt-0.5 text-muted-foreground">
                These are the closest articles, but they may not answer the question.
              </p>
            </div>
            <CommandGroup heading="Possible matches">
              {response.related.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  current={currentPageId === result.id}
                  onSelect={() => chooseArticle(result.id)}
                />
              ))}
            </CommandGroup>
          </>
        )}

        {!indexing && response.status === "results" && response.bestMatch && (
          <>
            {response.isSpellingTolerantMatch && (
              <p className="small px-4 py-2 text-muted-foreground">
                Showing the closest spelling match.
              </p>
            )}
            <CommandGroup heading="Best match">
              <SearchResultItem
                result={response.bestMatch}
                isBestMatch
                current={currentPageId === response.bestMatch.id}
                onSelect={() => chooseArticle(response.bestMatch!.id)}
              />
            </CommandGroup>
            {response.related.length > 0 && (
              <CommandGroup heading="Related results">
                {response.related.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    bestScore={response.bestMatch?.score}
                    rank={index + 2}
                    current={currentPageId === result.id}
                    onSelect={() => chooseArticle(result.id)}
                  />
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      <div className="small flex items-center gap-4 border-t border-brand-hairline bg-brand-surface-alt px-4 py-2.5 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-brand-hairline bg-brand-surface px-1.5 py-0.5">
            ↑↓
          </kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-brand-hairline bg-brand-surface px-1.5 py-0.5">
            Enter
          </kbd>
          Open
        </span>
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <kbd className="rounded border border-brand-hairline bg-brand-surface px-1.5 py-0.5">
            Esc
          </kbd>
          Close
        </span>
      </div>
    </CommandDialog>
  );
}
