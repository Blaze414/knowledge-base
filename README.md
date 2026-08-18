# Docs Companion — Snoopy HQ Support Centre

A content-driven knowledge-base application: searchable help articles, visual
step-by-step walkthroughs, interactive slideshows, and a direct support contact
channel. Articles are authored as typed TypeScript modules, not loose HTML, so
navigation, search indexes, and link integrity are all derived from one source
of truth and validated at build time.

Built with TanStack Start (React 19 + Vite), Tailwind CSS v4, and shadcn/ui on
Radix primitives. Server rendering and the production build target Cloudflare
via Nitro.

---

## Contents

| Section                                         | Subject                                          |
| ----------------------------------------------- | ------------------------------------------------ |
| [Features](#features)                           | What the application does                        |
| [Screenshots](#screenshots)                     | The interface at a glance                        |
| [Tech stack](#tech-stack)                       | Runtime and tooling                              |
| [Quick start](#quick-start)                     | Install and run locally                          |
| [Environment variables](#environment-variables) | Server-only support delivery config              |
| [Scripts](#scripts)                             | Every npm script and when to use it              |
| [Project structure](#project-structure)         | Directory ownership                              |
| [Content architecture](#content-architecture)   | How articles, media, and categories fit together |
| [Search](#search)                               | Smart Search and the generated indexes           |
| [Support requests](#support-requests)           | Contact form and email delivery                  |
| [Testing](#testing)                             | Unit, property-based, and visual tests           |
| [Build and deploy](#build-and-deploy)           | Production pipeline                              |
| [Documentation map](#documentation-map)         | Which document answers which question            |

---

## Features

- **Structured article catalogue** — 64 articles across 6 customer-facing
  categories (shopping, ordering and checkout, shipping and tracking, returns
  and refunds, gifts and bulk, accounts and support).
- **Three authoring modes** — drop-in _Markdown_ folders that publish
  themselves, _standard_ articles (step-based, defined by data), and _custom_
  articles (bespoke layout and components), all sharing one registry and one set
  of stable IDs.
- **Self-registering content** — drop a Markdown folder into
  `src/content/import/` or an image into `src/assets/media/articles/` and it
  appears: ids are derived from filenames, the sidebar entry is added
  automatically, and steps get their circular badge. No code edit.
- **Smart Search** — fuzzy, ranked, confidence-scored search over a
  build-time-generated index, with a command-palette dialog.
- **Rich content tokens** — images, downloadable documents, YouTube videos,
  callouts, collapsible details, sticky steps, choosers, and highlights, all
  referenced by ID and validated.
- **Interactive slideshows** — immersive, keyboard-navigable visual
  walkthroughs registered centrally and embedded in articles.
- **Contact support** — validated form posting to a rate-limited server route
  that delivers email through Resend.
- **Content validation** — the build fails on unknown media references, broken
  internal links, duplicate IDs, or orphaned articles.
- **Automated media optimisation** — source images are converted to responsive,
  modern formats before the app is built.
- **Theming and accessibility** — light/dark support, keyboard navigation, and
  reduced-motion handling, per the design system in `Design.md`.

## Screenshots

Captured from the running application with Playwright at a desktop viewport.
These are documentation assets in `docs/screenshots/`; they are not article
media and are not part of the runtime bundle.

### Knowledge-base home

![Snoopy HQ home page with the Ask a question or search articles control, common questions, and knowledge-base categories](./docs/screenshots/home.webp)

The home screen deliberately omits the article sidebar: one prominent Smart
Search entry point, a short list of frequent tasks, and category browsing —
without exposing the full hierarchy to a first-time visitor.

### Smart Search

![Smart Search dialog answering Where is my order with a Best match, highlighted terms, related results, and keyboard instructions](./docs/screenshots/smart-search.webp)

Natural-language input, a clearly labelled best match, confidence badges on
related results, highlighted matching excerpts, on-device privacy messaging, and
keyboard guidance.

### Article reader

![How to Contact Customer Support article showing the persistent left navigation, breadcrumbs, category, article title, Share control, circular step heading, large screenshot, and right Table of Contents launcher](./docs/screenshots/article-reader.webp)

The reader keeps the whole information hierarchy visible: header, searchable
navigation, breadcrumbs, category context, article title, Share action, step
content, instructional media, and the floating Table of Contents launcher.

### Interactive slideshow

![Interactive customer support slideshow on step 2.1 showing the large instructional image, equal previous and next controls, expanded numbered step indicator, and hover preview card](./docs/screenshots/interactive-slideshow.webp)

Nested step `2.1` with the enlarged image treatment, bounded previous/next
controls, the expanded step pill, and a hover preview card. The same controls
support pointer, keyboard, focus, saved progress, and reduced-motion behaviour.

## Tech stack

| Layer           | Choice                                                                      |
| --------------- | --------------------------------------------------------------------------- |
| Framework       | TanStack Start, TanStack Router (file-based), TanStack Query                |
| UI              | React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion, lucide-react |
| Search          | Fuse.js plus a custom ranking layer                                         |
| Validation      | Zod v4 (content, forms, and API payloads)                                   |
| Build           | Vite 8, Nitro (Cloudflare target), Sharp for image optimisation             |
| Quality         | ESLint 9 + Prettier, Vitest, fast-check, Playwright                         |
| Package manager | Bun (`bun.lock`); npm also works                                            |

## Quick start

Requires Node.js 20+ (or Bun).

```bash
npm install
npm run dev
```

Open the URL Vite prints. Content changes hot-reload; generated indexes are
rebuilt by the `prebuild` step, so run the validation scripts manually after
large content edits (see [Scripts](#scripts)).

## Environment variables

All support-delivery settings are **server-only**. Never prefix them with
`VITE_` — that would ship them to the browser. Copy `.env.example` to
`.env.local` and fill in:

| Variable             | Required                | Purpose                                               |
| -------------------- | ----------------------- | ----------------------------------------------------- |
| `RESEND_API_KEY`     | Yes, for email delivery | Resend API key used by the support route              |
| `SUPPORT_TO_EMAIL`   | No                      | Recipient override                                    |
| `SUPPORT_FROM_EMAIL` | No                      | Sender override; use a verified domain in production  |
| `SUPPORT_TIME_ZONE`  | No                      | Timestamp timezone, defaults to `Australia/Melbourne` |

Without `RESEND_API_KEY` the form still validates and the route still responds;
delivery is simply not performed.

## Scripts

| Script                        | What it does                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Start the Vite dev server                                                                             |
| `npm run build`               | Full production build (runs `prebuild` first)                                                         |
| `npm run build:dev`           | Production build with development mode settings                                                       |
| `npm run preview`             | Serve the built `.output/` worker locally via Wrangler                                                |
| `npm run validate:content`    | Check the content graph: IDs, media references, internal links, duplicate image ids, missing alt text |
| `npm run index:content`       | Regenerate `public/content-index.json` and `public/search-index.json`                                 |
| `npm run optimize:images`     | Generate optimised responsive assets from source images                                               |
| `npm run audit:colors`        | Report colour usage that bypasses design tokens                                                       |
| `npm run lint`                | ESLint over the repository                                                                            |
| `npm run format`              | Prettier write                                                                                        |
| `npm run test:fuzz:inline-md` | Property-based tests for the inline-markdown renderer                                                 |
| `npm run test:visual`         | Playwright visual regression suite                                                                    |
| `npm run test:visual:update`  | Re-record visual baselines                                                                            |

`prebuild` chains `optimize:images` → `validate:content` → `index:content`, so a
plain `npm run build` never ships a stale index or an unresolved reference.

## Project structure

```
src/
  routes/            File-based routes (__root.tsx is the only shell)
    api/support.ts   Rate-limited support submission endpoint
  components/        Feature components (knowledge base, search, slideshow, dialogs)
    ui/              shadcn/ui primitives
  content/           All authored content and registries
    catalog.ts       Category metadata and article order only
    articles/        standard/ and custom/ article modules + registry
    images.ts, documents.ts, videos.ts, slideshows.ts, callouts.ts, choosers.ts
    brand.ts         Central branding configuration
  lib/               Search, inline markdown, support delivery helpers
  assets/            Source media (originals; optimised output is generated)
  styles.css         Tailwind layer and design tokens
scripts/             Validation, indexing, image optimisation, Vite plugins
tests/visual/        Playwright specs and helpers
docs/                Focused technical notes and screenshots
public/              Static assets and generated indexes
```

Generated files — `src/routeTree.gen.ts`, `public/content-index.json`,
`public/search-index.json`, and optimised image output — are never edited by
hand.

## Content architecture

Content is data, and it registers itself. `catalog.ts` owns category metadata
and the order of the articles it lists; anything it does not list is appended to
its own category automatically, so publishing never requires editing it.

- **Drop-in Markdown** (`src/content/import/<folder>/`) — one `.md` file plus
  its images. The folder name becomes the article id, each image filename
  becomes an image id, Markdown image links become registry tokens carrying
  their alt text, and `## 1. Title` / `## Step 1: Title` headings both render
  with the circular step badge. See
  [src/content/import/README.md](src/content/import/README.md).

- **Standard articles** (`articles/standard/<category>/`) describe steps,
  expected outcomes, and media tokens declaratively. Use these by default.
- **Custom articles** (`articles/custom/`) opt into bespoke layout when a page
  needs components a step list cannot express.
- **Stable IDs** are the contract. Every article, image, document, video,
  callout, and slideshow is referenced by ID; renaming an ID breaks links, so
  IDs are treated as permanent.
- **Media registries** — images are discovered from the optimised output, so an
  image needs no import and no dimensions; `npm run optimize:images` writes the
  `.webp` variants and a `manifest.json` of intrinsic sizes, and `images.ts`
  pairs them up. Only alt text and captions are authored by hand — in the
  Markdown link for drop-in articles, or in `imageMeta` otherwise. Documents,
  videos, and slideshows keep their own registries.

Adding or editing content is documented step by step in
[MAINTAINER_MANUAL.md](./MAINTAINER_MANUAL.md).

## Search

Smart Search combines Fuse.js fuzzy matching with a custom scoring layer that
weights titles, tags, step text, and category context, then reports a confidence
level so low-quality matches degrade into suggestions rather than false
certainty. The index is generated at build time by `index:content`, keeping the
runtime bundle free of the full article corpus.

Implementation notes: [docs/smart-search.md](./docs/smart-search.md).

## Support requests

`src/routes/api/support.ts` accepts the contact form submission. It enforces a
12 KB body cap, a per-client rate limit (3 requests per 10 minutes, keyed on the
forwarded client address), and Zod validation before handing off to Resend.
Responses are always `no-store`. The client dialog lives in
`src/components/contact-support-dialog.tsx`.

## Testing

| Kind              | Location                          | Run with                      |
| ----------------- | --------------------------------- | ----------------------------- |
| Unit              | `src/**/*.test.ts(x)`             | `npx vitest run`              |
| Property-based    | `src/lib/inline-md.fuzz.test.tsx` | `npm run test:fuzz:inline-md` |
| Visual regression | `tests/visual/`                   | `npm run test:visual`         |
| Content integrity | `scripts/validate-content.ts`     | `npm run validate:content`    |

Visual baselines and their update workflow are described in
[docs/visual-baselines.md](./docs/visual-baselines.md). Route
`/visual-fixtures` renders isolated component states for those snapshots.

## Build and deploy

```bash
npm run build
npm run preview
```

The Nitro output is a Cloudflare module worker in `.output/`, so `preview` runs
Wrangler against it rather than a plain static server.

The build runs image optimisation, content validation, and index generation
before Vite compiles, so a stale index or an unresolved media reference fails
the build instead of reaching production. Nitro produces the server output with
Cloudflare as the default target.

## Documentation map

| Question                          | Document                                                           |
| --------------------------------- | ------------------------------------------------------------------ |
| How do I add or edit content?     | [MAINTAINER_MANUAL.md](./MAINTAINER_MANUAL.md)                     |
| How does the whole system work?   | [PROJECT_HANDOVER.md](./PROJECT_HANDOVER.md)                       |
| What are the visual and UX rules? | [Design.md](./Design.md)                                           |
| How does search rank results?     | [docs/smart-search.md](./docs/smart-search.md)                     |
| How do visual tests work?         | [docs/visual-baselines.md](./docs/visual-baselines.md)             |
| What are the routing conventions? | [src/routes/README.md](./src/routes/README.md)                     |
| How do I define an article?       | [src/content/articles/README.md](./src/content/articles/README.md) |
