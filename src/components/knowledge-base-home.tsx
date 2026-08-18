import { motion } from "framer-motion";
import { ArrowRight, BookOpen, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { pageContents } from "@/content/articles";
import { findCategoryForPage, sidebarCategories } from "@/content/categories";
import { siteBrand } from "@/content/brand";

const commonArticleIds = [
  "guides-contact-customer-support",
  "shipping-track-order",
  "shipping-arrival-date",
  "ordering-cancel-change",
  "returns-start-return",
  "ordering-apply-coupon",
] as const;

interface KnowledgeBaseHomeProps {
  continuePageId: string | null;
  onDismissContinue: () => void;
  onOpenSearch: () => void;
  onSelectPage: (pageId: string) => void;
  reducedMotion: boolean;
}

export function KnowledgeBaseHome({
  continuePageId,
  onDismissContinue,
  onOpenSearch,
  onSelectPage,
  reducedMotion,
}: KnowledgeBaseHomeProps) {
  const continuePage = continuePageId ? pageContents[continuePageId] : null;
  const commonArticles = commonArticleIds
    .map((id) => pageContents[id])
    .filter((article) => Boolean(article));

  return (
    <motion.main
      id="kb-main-content"
      tabIndex={-1}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
      className="min-w-0 bg-brand-surface-alt"
    >
      <section className="border-b border-brand-hairline bg-brand-surface">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-eyebrow font-semibold text-primary">{siteBrand.name}</p>
            <h1 className="h1 mt-3 text-foreground">How can we help?</h1>
            <p className="body mt-3 max-w-2xl text-muted-foreground">
              Find clear answers about shopping, orders, delivery, returns, gifts, and customer
              support.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            className="group mt-7 flex min-h-14 w-full max-w-3xl cursor-pointer items-center gap-3 rounded-brand border border-brand-hairline bg-brand-surface-alt px-4 text-left shadow-elev-1 transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky hover:bg-brand-surface hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Ask a question or search articles"
          >
            <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="body min-w-0 flex-1 text-muted-foreground">
              Ask a question or search articles
            </span>
            <span className="small hidden shrink-0 items-center gap-1 text-primary sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Smart search
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        {continuePage && (
          <section aria-labelledby="continue-reading-heading">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-eyebrow font-semibold text-primary">Continue reading</p>
                <h2 id="continue-reading-heading" className="h3 mt-1 text-foreground">
                  Pick up where you left off
                </h2>
              </div>
              <button
                type="button"
                onClick={onDismissContinue}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-brand text-muted-foreground transition-colors duration-200 hover:bg-brand-surface hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Dismiss continue reading"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSelectPage(continuePage.id)}
              className="group mt-5 flex w-full cursor-pointer items-center gap-4 rounded-brand border border-brand-hairline bg-brand-surface px-5 py-4 text-left shadow-panel-soft transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky/70 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="h5 block text-foreground">{continuePage.title}</span>
                <span className="small mt-1 block text-muted-foreground">
                  {findCategoryForPage(continuePage.id)?.name ?? "Knowledge base"}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </section>
        )}

        <section aria-labelledby="common-questions-heading">
          <div>
            <p className="text-eyebrow font-semibold text-primary">Common questions</p>
            <h2 id="common-questions-heading" className="h2 mt-1 text-foreground">
              Start with a frequent task
            </h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {commonArticles.map((article) => {
              const category = findCategoryForPage(article.id);
              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => onSelectPage(article.id)}
                  className="group flex min-h-24 cursor-pointer items-start gap-4 rounded-brand border border-brand-hairline bg-brand-surface px-5 py-4 text-left shadow-panel-soft transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky/70 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-brand bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
                    {category?.icon ?? <BookOpen aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="body block font-semibold leading-snug text-foreground">
                      {article.title}
                    </span>
                    <span className="small mt-1 block text-muted-foreground">
                      {category?.name ?? "Knowledge base"}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="browse-topics-heading">
          <div>
            <p className="text-eyebrow font-semibold text-primary">Browse topics</p>
            <h2 id="browse-topics-heading" className="h2 mt-1 text-foreground">
              Explore the knowledge base
            </h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sidebarCategories.map((category) => {
              const firstPage = category.subPages[0];
              if (!firstPage) return null;
              const articleCount = category.subPages.length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectPage(firstPage.id)}
                  className="group flex min-h-32 cursor-pointer flex-col items-start rounded-brand border border-brand-hairline bg-brand-surface px-5 py-5 text-left shadow-panel-soft transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-sky/70 hover:bg-brand-surface-alt hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={`Browse ${category.name}, ${articleCount} articles`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-brand bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
                    {category.icon}
                  </span>
                  <span className="h5 mt-4 block text-foreground">{category.name}</span>
                  <span className="small mt-1 flex w-full items-center justify-between gap-3 text-muted-foreground">
                    <span>
                      {articleCount} {articleCount === 1 ? "article" : "articles"}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </motion.main>
  );
}
