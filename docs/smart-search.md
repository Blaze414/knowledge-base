# Smart Search

The knowledge base uses a local hybrid search pipeline. It does not call a hosted AI service,
require an API key, or generate answers. It ranks factual articles already present in the content
catalogue.

## Ranking

`src/lib/kb-search.ts` builds serialisable records from the shared article, category, document,
image, video, and slideshow registries. `src/lib/smart-search.ts` combines:

- exact stemmed token matches;
- conservative synonym and intent expansion;
- bounded edit-distance spelling tolerance plus Fuse.js fuzzy matching;
- weighted title, tag, category, document, media, and body fields;
- confidence gating for Best match, possible matches, and no-result states.

Title and tag evidence is deliberately stronger than body-only evidence. Search functions are pure
and do not depend on React, making them suitable for unit tests and a future Web Worker.

## Content Changes

All article modules are indexed automatically from `pageContents`. Standard modules under
`src/content/articles/standard/**/*.ts` and rich modules under
`src/content/articles/custom/*.ts` are discovered through Vite's eager module globs. The catalogue
contains only ordered article IDs, so it never duplicates searchable article bodies.

Creating, editing, or deleting an article module changes the next record build; referenced
registry metadata is resolved each time. Add or remove the same stable ID in `catalog.ts` to control
navigation membership and order. Content validation rejects missing catalogue targets and unlisted
article modules. The corpus signature hashes complete field values, so a same-length text edit
still changes the signature.

For a future live CMS, apply the content update and then call:

```ts
import { requestKnowledgeBaseReindex } from "@/lib/kb-search-events";

requestKnowledgeBaseReindex("cms-publish");
```

If the CMS replaces the in-memory catalogue rather than mutating the application's shared content
store, pass the complete current snapshot. The search hook reconciles against that snapshot, so
new articles appear, edited metadata is refreshed, and IDs missing from the snapshot are removed:

```ts
requestKnowledgeBaseReindex("cms-sync", currentSearchCorpus);
```

Pass `null` as the second argument to return to the statically imported catalogue.

The React hook debounces repeated events for 300 ms before rebuilding Fuse. Query changes reuse the
existing index and never rebuild it on each keystroke.

## Production Builds

`npm run build` runs image optimisation, content validation, and `index:content` before Vite. The
index command regenerates both:

- `public/content-index.json`
- `public/search-index.json`

The application imports content directly and does not fetch either file to search. The generated
search snapshot exists for auditing and a future worker implementation, without becoming a second
manually maintained source of truth.
