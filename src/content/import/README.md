# Drop-in articles

Put one folder here per article. Everything else is automatic — no registry
entry, no catalogue id, no import statement, no code change of any kind.

```
src/content/import/
  returns-exchange/
    article.md
    exchange-form.png
    exchange-confirmation.png
```

Then run:

```bash
npm run optimize:images && npm run validate:content
```

The article appears at the end of its category in the sidebar, its images are
registered and served as responsive `.webp`, and its steps render with the
circular step badge.

## The Markdown file

```markdown
---
title: How to exchange an item
category: returns-refunds
tags: [exchange, returns]
---

Exchanges run through the same form as returns.

## 1. Open the request form

Sign in first so the order is attached automatically.

![Exchange form with the reason field highlighted](exchange-form.png)

## 2. Choose Exchange as the reason

Pick the replacement size or colour in the description field.

## Important

Exchanges are only available within 30 days of delivery.
```

### Frontmatter

| Key               | Required | Notes                                                                  |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `title`           | yes      | Shown as the article heading and in the sidebar                        |
| `category`        | yes      | A category id from `src/content/catalog.ts`                            |
| `id`              | no       | Defaults to the folder name                                            |
| `tags`            | no       | `[a, b]` or a dash list; category and id words are added automatically |
| `lastUpdated`     | no       | Free text, e.g. `2026-08-18`                                           |
| `readTime`        | no       | Estimated from word count when omitted                                 |
| `parentArticleId` | no       | Nests this article under a sibling, giving it dotted numbering         |
| `order`           | no       | Position among auto-added siblings                                     |
| `layout`          | no       | `sticky-steps` or `immersive-slideshow`                                |
| `video`           | no       | YouTube URL or 11-character id                                         |

### Ids

The article id is the folder name unless frontmatter overrides it. An image id
is its filename without the extension — `exchange-form.png` becomes
`[image:exchange-form]`. Ids must be unique across the whole project;
`validate:content` fails with the conflicting folders named if two images share
a filename.

### Steps

All of these produce the same numbered step with its circular badge:

```markdown
## Step 1: Open the order

## 1. Open the order

## 1) Open the order

## Step 1 - Open the order
```

Nested numbers work too — `## 2.1 Attach the label` renders as step 2.1.

### Images

Write ordinary Markdown image links. The alt text you write becomes the image's
alt text in the registry, and the optional title becomes its caption:

```markdown
![Alt text goes here](screenshot.png "Optional caption")
```

Alt text is not optional: `validate:content` fails if an article renders an
image that has none. Remote images (`https://…`) are left as-is and are not
registered.

## Editing later

Edit the Markdown file in place. To unpublish, delete the folder and re-run
`optimize:images` — nothing else refers to it.

For hand-authored TypeScript articles with custom layouts, see
[../articles/README.md](../articles/README.md).
