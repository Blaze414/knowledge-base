# Snoopy HQ Docs Companion Design System

## 1. Purpose

Snoopy HQ is a customer-facing knowledge base for Peanuts Store shopping, ordering, delivery,
returns, gifts, and customer support. The interface should feel professional and dependable first,
with restrained warmth and character from the Snoopy and Woodstock brand assets.

This document describes the implemented design system and is the reference for future UI work.
The coded source of truth remains [`src/styles.css`](src/styles.css) and the components under
[`src/components`](src/components).

## 2. Experience Principles

1. **Answers before decoration.** Search, navigation, article content, and support escalation are
   always more prominent than ornamental elements.
2. **Reader-first clarity.** Use comfortable body type, short line lengths, strong hierarchy, and
   large instructional images.
3. **One obvious next action.** Each view should clearly offer search, the next step, the next
   article, or customer support without competing calls to action.
4. **Honest assistance.** Smart Search identifies confidence and says when no reliable answer was
   found. It must never imply that a weak result is certain.
5. **Quiet consistency.** Navigation, dialogs, cards, and article tools use the same surfaces,
   borders, radii, and interaction states.
6. **Playful in small doses.** Character assets and gentle motion add warmth without making a
   support workflow feel childish or distracting.
7. **Accessible by default.** Keyboard, screen-reader, reduced-motion, touch, light-mode, and
   dark-mode behaviour are requirements rather than optional enhancements.

## 3. Brand

| Element            | Specification                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| Product name       | **Snoopy HQ**                                                              |
| Product descriptor | **Docs Companion**                                                         |
| Primary logo       | Snoopy and Woodstock image configured in `src/content/brand.ts`            |
| Page-outline icon  | Woodstock SVG configured in `src/content/brand.ts`                         |
| Voice              | Direct, calm, factual, friendly, and concise                               |
| Australian usage   | Use Australian English and Australian date/time formatting where displayed |

All replaceable brand assets and accessible labels must be configured in
[`src/content/brand.ts`](src/content/brand.ts). Components control display size; they must not own
duplicate asset paths.

## 4. Visual Foundations

### 4.1 Colour

Colours are semantic CSS custom properties expressed in OKLCH. Components must use tokens rather
than hard-coded colour values.

| Role              | Token                        | Light reference | Usage                                          |
| ----------------- | ---------------------------- | --------------- | ---------------------------------------------- |
| Primary           | `--brand-navy` / `--primary` | `#1B3A5C`       | Headings, primary actions, active navigation   |
| Strong primary    | `--brand-navy-strong`        | `#0F2744`       | High-contrast branded surfaces                 |
| Action accent     | `--brand-sky`                | `#5B9AB5`       | Focus, links, hover borders, active indicators |
| Soft selection    | `--brand-sky-soft`           | `#E8F4F8`       | Selected search and navigation backgrounds     |
| Warm accent       | `--brand-coral`              | `#E07A5F`       | Restrained emphasis and supporting accents     |
| Success           | `--success`                  | `#3D8B8B`       | Confirmed success and resolved states          |
| Destructive       | `--destructive`              | `#E74C3C`       | Errors and destructive actions only            |
| Main surface      | `--brand-surface`            | `#FFFFFF`       | Cards, dialogs, article surfaces               |
| Alternate surface | `--brand-surface-alt`        | `#F7F9FB`       | Page bands and quiet contrast                  |
| Border            | `--brand-hairline`           | `#E2E8F0`       | Dividers, card edges, input outlines           |
| Body text         | `--foreground`               | `#334155`       | Long-form copy                                 |
| Muted text        | `--brand-muted`              | `#475569`       | Secondary labels and helper copy               |

Dark mode is not a colour inversion. It uses graphite surfaces, light neutral text, and brighter
blue interaction tokens. Branded colour is reserved for state and action so the interface does not
become a single-hue dark-blue surface.

Rules:

- Use `text-foreground` for primary copy and `text-muted-foreground` for secondary copy.
- Use `bg-brand-surface` for contained tools and `bg-brand-surface-alt` for page backgrounds.
- Do not introduce new raw hex, RGB, or HSL values in components.
- Confirm text contrast is at least WCAG AA in both themes.
- Never communicate status by colour alone; pair colour with text, an icon, or structure.

### 4.2 Typography

The production type system uses Inter-compatible system stacks for UI and display text, with Source
Serif 4 as an optional editorial face for quotations.

| Style          | Size     | Line height | Weight | Use                           |
| -------------- | -------- | ----------- | ------ | ----------------------------- |
| `h1`           | 28-32 px | 1.2         | 600    | Page and article title        |
| `h2`           | 22-24 px | 1.25        | 600    | Major article or page section |
| `h3`           | 18 px    | 1.35        | 500    | Compact section heading       |
| `h4`           | 16 px    | 1.4         | 500    | Subsection heading            |
| `h5`           | 14 px    | 1.35        | 600    | Card and navigation heading   |
| `h6`           | 13 px    | 1.25        | 600    | Uppercase compact label       |
| `body`         | 16 px    | 26.4 px     | 400    | Default UI and article copy   |
| `small`        | 13 px    | 18.4 px     | 400    | Metadata and supporting text  |
| `text-eyebrow` | 12 px    | 16 px       | 600    | Category and section labels   |

Rules:

- Letter spacing is `0`; do not use negative tracking.
- Keep article measure near 46 rem on wide screens.
- Do not make card headings compete with page titles.
- Use sentence case for controls and headings. Reserve uppercase for short category labels.
- Do not display reading-time or update-date metadata unless it directly helps a future workflow.

### 4.3 Spacing and Geometry

- Base component radius: `rounded-brand` = **8 px**.
- Major surface radius: `rounded-brand-lg` = **8 px**.
- Pills and status badges: `rounded-brand-pill` or `rounded-full`.
- Common spacing rhythm: 4, 8, 12, 16, 24, 32, 40, 48, and 64 px.
- Responsive section padding uses `--space-section-x` and `--space-section-y`.
- Minimum standard control height: 40 px; prominent search: 56 px.
- Small icon-only controls may be 36 px, but touch-critical controls should target at least 44 px.

Cards are for repeated items, dialogs, and framed tools. Do not wrap whole page sections in floating
cards or place cards inside cards.

### 4.4 Elevation

Use the tokenised flat-shadow system:

- `shadow-elev-1`: inputs and quiet controls.
- `shadow-panel-soft`: default cards.
- `shadow-panel`: raised or sticky panels.
- `shadow-panel-hover`: interactive card hover.
- `shadow-elev-2`: dialogs and overlays.
- `shadow-focus-soft`: focused surfaces.

Borders should carry most of the visual separation. Shadows remain subtle and must not create a
neumorphic appearance.

## 5. Responsive Layout

Tailwind breakpoints are used consistently:

| Range                 | Behaviour                                                                       |
| --------------------- | ------------------------------------------------------------------------------- |
| Mobile, under 640 px  | Single column; icon search; navigation and outline use compact controls         |
| Small, 640-767 px     | More horizontal padding; labelled search control; two-column layouts where safe |
| Medium, 768-1023 px   | Full top-bar search; article remains single content column                      |
| Large, 1024-1279 px   | Persistent 288 px left navigation plus flexible content                         |
| Extra large, 1280 px+ | 288 px left navigation, article, and 240 px open or 64 px closed outline rail   |

The application shell is capped at **1440 px**. The sticky top bar is **64 px** high.

### Home

- No left navigation or right outline is shown.
- Content is capped at `max-w-5xl`.
- The first viewport prioritises the product identity, concise help statement, and Smart Search.
- Common tasks and topic categories follow in uncluttered full-width sections.

### Article

- Standard article width is `max-w-3xl`, narrowing to approximately 46 rem at extra-large sizes.
- Breadcrumb, category, title, and Share action form one clear header block.
- The persistent left navigation appears at large screens and above.
- The page outline appears as an inline sticky control below extra-large screens and as a right rail
  at extra-large screens.
- Tables and code blocks may scroll horizontally; the overall page must not.

### Immersive Slideshow

- Retains the left navigation on large screens.
- Main content is capped at `max-w-6xl`.
- Images use a stable 16:10 frame and remain large enough to inspect without zooming.
- Previous and next controls flank the image and share the same default styling.

## 6. Navigation

### Top Bar

The top bar contains:

1. Mobile navigation trigger when an article is open.
2. Modular brand logo and product name.
3. Smart Search control on article views.
4. Theme toggle.
5. Contact Support action.

It uses the same alternate surface and hairline border as the rest of the shell. Avoid a visually
detached or disproportionately dark header.

### Left Navigation

- Persistent and non-collapsible on desktop.
- Replaced with a sheet on smaller screens.
- Categories use compact section bands; article labels use readable 14-16 px text and deliberate
  vertical spacing.
- Hover must be unmistakable through both background and text/border change.
- The current article has a stronger selected state than hover.
- Preserve scroll position and reveal the active article after navigation.
- Do not add a second search field; global Smart Search is the canonical search control.

### Page Outline

- Title: **Table of Contents**.
- On desktop, a circular modular Woodstock trigger follows the viewport.
- Hover or activation opens the sticky outline card; selecting a heading closes it after navigation.
- The active section updates during scrolling and the target heading briefly highlights after a
  jump.
- The card visually emerges from the trigger but must not use an artificial cut-out shape.
- Escape closes the card and restores focus to the trigger.

## 7. Page Patterns

### 7.1 Knowledge Base Home

Order of content:

1. Product eyebrow, “How can we help?” title, and one-sentence scope.
2. Prominent “Ask a question or search articles” control with a subtle Smart Search indicator.
3. Optional “Pick up where you left off” item.
4. Common questions.
5. Browse topics.

The home is a working support entry point, not a marketing landing page.

### 7.2 Standard Article

Order of content:

1. Breadcrumb.
2. Category label.
3. Article title.
4. Share and optional “Start the steps” actions.
5. Inline Table of Contents where required.
6. Article content with circular step numbers.
7. In-series and related articles.
8. Previous/next navigation.
9. Article feedback.

Steps use numbered circles connected to their headings. Action and expected-outcome imagery should
be displayed near the relevant text at a readable width, not as a thumbnail.

### 7.3 Smart Search

Smart Search is a command-style dialog labelled **Ask a question or search articles**.

Required states:

- Idle suggestions.
- Indexing/loading.
- One labelled `Best match`.
- `Strong match`, `Relevant`, and `Possible match` result badges based on confidence and rank.
- Spelling-tolerant notice.
- Honest low-confidence state.
- Honest no-result state with useful alternative queries.

Each result includes title, category, a relevant two-line excerpt, match reasons, and a rank badge.
Arrow keys navigate, Enter opens, and Escape closes. Search remains private, on-device, and free of
network requests.

### 7.4 Contact Support

- Use a responsive modal with one-column fields on mobile and sensible grouping on larger screens.
- Required fields use explicit labels and a visible required marker.
- Preserve drafts locally and explain restored state without interrupting the form.
- Validation appears beside the affected field and in a concise summary when useful.
- The primary action remains disabled only when submission cannot succeed, with the reason evident.
- Submitting sends the request directly; the user is not redirected to a mail application.
- Success, failure, and retry states must match the active theme.

### 7.5 Slideshow Guide

- Show the article breadcrumb, category, title, and Share action before the slideshow.
- Each slide title includes a circular step number aligned to the title centre.
- Text moves vertically and media moves horizontally with a consistent 300 ms transition.
- Navigation stops at the first and last slide; it never wraps infinitely.
- Remember the last opened slide when storage is available.
- The compact step pill expands on hover or focus and shows all numbered steps together.
- Step previews are informative hover/focus cards and must remain within the viewport.

## 8. Components and States

### Buttons

- Use Lucide icons where a recognised symbol exists.
- Icon-only controls require an accessible name and tooltip when meaning is not obvious.
- Default transition: 200 ms colour, border, shadow, or a maximum 1 px lift.
- Disabled controls retain legibility and use `not-allowed` behaviour.
- Primary and secondary actions must not have identical visual weight.

### Inputs

- Height: 40 px standard; 56 px for prominent search.
- Background: semantic card surface.
- Border: input/hairline token.
- Focus: 2 px semantic ring plus visible offset.
- Placeholder text cannot replace a persistent accessible label.

### Cards and Lists

- Repeated navigation cards use border, surface, and low elevation.
- Hover combines surface, border, and modest shadow change without resizing the layout.
- Dense article lists should use divided rows instead of nested cards.

### Badges

- Badges communicate category, status, rank, or compact metadata only.
- Use short labels and pill geometry.
- `Best match` receives primary emphasis; lower search ranks become progressively quieter.
- Do not display raw ranking numbers or percentages that imply false precision.

### Media

- Use registered asset IDs from `src/content/images.ts`.
- Article media lives under `src/assets/media/articles` by subject.
- Provide descriptive alt text; decorative brand images use empty alt text when adjacent text already
  names the product.
- Use generated WebP variants and responsive sources where available.
- Preserve image aspect ratio and prevent layout shift with known dimensions or aspect-ratio boxes.

## 9. Motion

| Interaction          | Duration    | Behaviour                             |
| -------------------- | ----------- | ------------------------------------- |
| Hover/focus colour   | 150-200 ms  | No layout shift                       |
| Page fade            | 220 ms      | Opacity only                          |
| Slideshow transition | 300 ms      | Directional media and text movement   |
| Sheet/dialog         | 200-300 ms  | Fade and controlled translation/scale |
| Navigation target    | Brief pulse | Soft selection background, then clear |

All motion must respect `prefers-reduced-motion`. In reduced-motion mode, transitions become
effectively instant, smooth scrolling is disabled, and information must remain understandable.

## 10. Accessibility

- Target WCAG 2.2 AA.
- Use semantic landmarks: `header`, `nav`, `main`, `article`, `aside`, `section`, and `footer`.
- Maintain one meaningful page-level `h1` and a logical heading order.
- Include “Skip to main content”.
- Every interaction must work by keyboard.
- Focus indicators must remain visible in both themes.
- Dialogs trap focus, close with Escape, and return focus to the trigger.
- Current page and current step use `aria-current`; toggles expose `aria-expanded` or `aria-pressed`.
- Live status changes use restrained `aria-live` regions.
- Touch targets should be at least 44 by 44 px where practical.
- Never rely on hover alone; expose the same information on focus or activation.
- Avoid unexpected automatic navigation and infinite carousels.

## 11. Content Design

- Prefer task titles beginning with “How to…” when the article is procedural.
- Use explicit numbered steps with one primary action per step.
- Separate warnings under **Important** rather than embedding them in dense paragraphs.
- State uncertainty and policy limitations directly.
- Use Australian English (`colour`, `personalised`) except when quoting official interface labels.
- External sources appear under a final **Sources** heading and open in a new tab.
- Use **Share**, not “Copy link”; confirmation text becomes **Copied**.
- Avoid reading-time, redundant date, author, and decorative metadata.
- Support escalation appears once per workflow; do not duplicate Contact Support actions.

## 12. Implementation Rules

- Framework: React 19, TanStack Start, Tailwind CSS 4, Radix UI, Framer Motion, Lucide.
- Design tokens: [`src/styles.css`](src/styles.css).
- Brand assets: [`src/content/brand.ts`](src/content/brand.ts).
- Category grouping and article order: [`src/content/catalog.ts`](src/content/catalog.ts).
- Standard article modules: [`src/content/articles/standard`](src/content/articles/standard).
- Rich article modules: [`src/content/articles/custom`](src/content/articles/custom).
- Article discovery and registry: [`src/content/articles/index.ts`](src/content/articles/index.ts).
- Media registry: [`src/content/images.ts`](src/content/images.ts).
- Smart Search UI: [`src/components/smart-search-dialog.tsx`](src/components/smart-search-dialog.tsx).
- Smart Search ranking: [`src/lib/smart-search.ts`](src/lib/smart-search.ts).

When adding a token, define light and dark values, expose it through `@theme inline`, and use the
semantic utility. Do not create a local component colour that duplicates an existing role.

Every article must own its title and content in a dedicated module. The catalogue may contain its
stable ID for grouping and order, but must not duplicate the article title, body, tags, or media
tokens. This keeps content edits isolated and prevents a large central catalogue from becoming a
merge-conflict hotspot.

## 13. Quality Checklist

Before approving a UI change, verify:

- [ ] Light and dark themes both retain readable contrast.
- [ ] 375 px, 768 px, 1024 px, and 1440 px layouts have no overlap or horizontal page overflow.
- [ ] Text fits controls and cards without clipping.
- [ ] Keyboard focus order is logical and focus remains visible.
- [ ] Escape, Enter, and arrow-key behaviours work where documented.
- [ ] Hover states also have focus or active equivalents.
- [ ] Reduced-motion mode removes nonessential animation.
- [ ] Images are readable, compressed, correctly sized, and have appropriate alt text.
- [ ] Empty, loading, success, error, low-confidence, and disabled states are covered.
- [ ] New content is searchable and deleted content disappears after indexing.
- [ ] TypeScript, lint for changed files, tests, content validation, and production build pass.

## 14. Anti-Patterns

Avoid:

- Duplicate search fields or duplicate support actions.
- Marketing-style hero layouts in the working knowledge base.
- Oversized headings inside compact tools.
- Nested cards and excessive rounded containers.
- Purple-heavy gradients, decorative blobs, glass effects, or one-note palettes.
- Weak hover states, invisible borders, or colour-only selection.
- Manual SVG icons when a Lucide icon exists.
- Emoji used as interface icons.
- Animations longer than 500 ms for routine navigation.
- Raw Markdown, asset IDs, search scores, or implementation metadata in reader-facing UI.
- Fabricated policy details or generative answers presented as verified support information.
