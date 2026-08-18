# Article modules

Every active article owns its content in a dedicated TypeScript file:

```text
articles/
|-- standard/<category-id>/<article-id>.ts
|-- custom/<article-id>.ts
|-- define-article.ts
`-- index.ts
```

- Use `standard/` for ordinary step-based guidance.
- Use `custom/` when an article needs hand-authored content, media tokens, or a special layout.
- `index.ts` auto-discovers both directories with `import.meta.glob`; never add a manual import list.
- `catalog.ts` contains ordered article IDs only. It does not contain article titles or bodies.

## Add a standard article

Create `standard/<category-id>/<article-id>.ts`:

```ts
import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-find-tracking-number",
  categoryId: "shipping-tracking",
  title: "How to find a tracking number",
  steps: ["Open the shipping confirmation email.", "Select the carrier tracking link."],
  sources: [
    {
      label: "Shipping policy",
      url: "https://peanuts.store/pages/shipping-policy",
    },
  ],
  tags: ["tracking", "shipment"],
});
```

Then add only its ID to the correct `articleIds` array in `catalog.ts`:

```ts
articleIds: [
  "shipping-track-order",
  "shipping-find-tracking-number",
],
```

The ID position controls navigation order. The article file owns its title, body, tags, sources, and category.

## Add a custom article

Create a default-exported `PageContent` file in `custom/` and add its ID to the catalogue exactly as above. Custom files are suitable for `[image:...]`, `[slideshow:...]`, documents, videos, nested steps, and immersive layouts.

## Image IDs

Register reusable images in `src/content/images.ts`, then reference the typed `imageIds` property from a custom article:

```ts
import { imageIds } from "../../images";

content: `## Step 1: Open the page

[image:${imageIds.supportFooterLink}]
`,
```

Use a separate stable image ID for each distinct screenshot state. TypeScript reports invalid properties, while content validation reports unresolved rendered tokens.

## Remove an article

1. Remove its ID from `catalog.ts`.
2. Delete its module from `standard/` or `custom/`.
3. Search for deep links and parent references with `rg '<article-id>' src`.
4. Run `npm run validate:content`.

Validation treats missing catalogue targets, duplicate IDs, and article modules absent from the catalogue as errors.
