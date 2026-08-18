/**
 * Registry of images used in the knowledge base.
 *
 * Images register themselves. Drop a `.png`, `.jpg`, or `.jpeg` anywhere under
 * `src/assets/media/articles/`, run `npm run optimize:images`, and the file is
 * available immediately — its id is the filename without the extension:
 *
 *     src/assets/media/articles/support/peanuts-support-refunds.png
 *     → [image:peanuts-support-refunds]
 *
 * No import, no dimensions, no `srcset` to maintain. The optimiser writes both
 * the full-width and 768px variants plus `manifest.json`, and this module pairs
 * them up.
 *
 * What still needs a human: alt text. Add an entry to `imageMeta` below with
 * `alt` (required for every image an article uses — `validate:content` fails
 * without it) and an optional `caption` and `presentation`.
 *
 * Every registry entry has a canonical id in `imageIds`. Articles can use
 * those ids directly, with editor autocomplete and compile-time checking, or
 * reference a discovered image by its filename id.
 *
 * Action and outcome rows can choose their own image from an article file.
 * Use `defineStepImages` near the top of the article so every step's pair is
 * typed, named, and managed in one place:
 *
 *     const stepImages = defineStepImages({
 *       openDashboard: {
 *         action: imageIds.dashboard,
 *         outcome: imageIds.validation,
 *       },
 *     });
 *
 * `src` can be any URL — an external link, a Lovable CDN asset
 * (`/__l5e/assets-v1/...`), or an imported asset's `.url`.
 */
import manifest from "@/assets/media/optimized/manifest.json";
import lessonStep1 from "@/assets/media/articles/lessons/lesson-step-1.gif.asset.json";
import lessonStep2 from "@/assets/media/articles/lessons/lesson-step-2.gif.asset.json";
import lessonStep3 from "@/assets/media/articles/lessons/lesson-step-3.gif.asset.json";
import { cdnAssetUrl } from "@/lib/cdn-asset";
import { importedImageMeta } from "./markdown-articles";

// Shared params applied to every CDN-hosted step screenshot so the base
// path + cache-busting strategy stays consistent. Bump `v` when a step
// screenshot is re-uploaded to force clients past the CDN cache.
const STEP_ASSET_PARAMS = { v: "1" } as const;
const stepUrl = (pointer: { url: string }) => cdnAssetUrl(pointer, { params: STEP_ASSET_PARAMS });
const responsiveWebp = (reading: string, full: string, fullWidth: number) =>
  `${reading} 768w, ${full} ${fullWidth}w`;

export interface ImageRef {
  src: string;
  alt: string;
  caption?: string;
  /** Controls whether the image stays in the text column or uses the wider screenshot layout. */
  presentation?: "standard" | "wide";
  /** Optional intrinsic dimensions — when set, the renderer reserves space to avoid CLS. */
  width?: number;
  height?: number;
  /** Optional responsive sources. `srcSet` is a standard `srcset` string. */
  srcSet?: string;
  /** Optional `sizes` hint paired with `srcSet`. Defaults to a sensible article width. */
  sizes?: string;
}

/** Editorial metadata. Everything else about an image comes from the file itself. */
type ImageMeta = Omit<ImageRef, "src" | "srcSet" | "width" | "height">;

const imageMeta: Record<string, ImageMeta> = {
  "snoopy-doghouse": {
    alt: "Snoopy's doghouse command center",
    caption: "Snoopy's doghouse command center at a glance.",
  },
  "snoopy-suppertime": {
    alt: "Suppertime schedule planning",
    caption: "Plan suppertime schedules days in advance.",
  },
  "snoopy-gang": {
    alt: "The Peanuts gang gathered together",
  },
  "peanuts-store-characters-menu": {
    alt: "Peanuts Store Characters menu with the Snoopy link visible",
    caption: "Open Characters, then choose Snoopy.",
  },
  "peanuts-store-snoopy-collection": {
    alt: "Peanuts Store Snoopy collection with products and filters",
    caption: "The Snoopy collection opens with products, filters, and sorting controls.",
  },
  "peanuts-support-footer-link": {
    presentation: "wide",
    alt: "Peanuts Store footer with the Support Center link under Customer Service",
    caption: "Choose Support Center from the Customer Service footer links.",
  },
  "peanuts-support-center-home": {
    alt: "Peanuts Store Support Center landing page with support categories",
    caption: "The Support Center opens with search and support category tiles.",
  },
  "peanuts-support-message-link": {
    alt: "Support Center page with Ordering Information selected and Message Customer Support highlighted",
    caption:
      "Scroll down and choose Message Customer Support if the category article does not answer the question.",
  },
  "peanuts-support-submit-request": {
    alt: "Submit a request page in Peanuts Store Support",
    caption:
      "The Submit a request form opens with email, request type, subject, and description fields.",
  },
  "peanuts-support-request-fields": {
    alt: "Submit a request form fields highlighted with email, support topic, subject, description, return reason, attachment, and submit button",
    caption: "Complete each required field, add attachments if needed, then select Submit.",
  },
  "peanuts-support-search-help": {
    presentation: "wide",
    alt: "Peanuts Store Support Center with the search bar and help categories highlighted",
    caption: "Search for a topic or choose the category that best matches your question.",
  },
  "peanuts-support-open-request-form": {
    presentation: "wide",
    alt: "Support Center categories with Message Customer Support highlighted near the bottom of the page",
    caption: "Scroll below the help categories and choose Message Customer Support.",
  },
  "peanuts-support-complete-request-form": {
    presentation: "wide",
    alt: "Submit a request form showing the email, request type, subject, description, return reason, and attachment fields",
    caption: "Complete the fields that apply to the support request.",
  },
  "peanuts-support-submit-button": {
    presentation: "wide",
    alt: "Bottom of the Submit a request form with the Submit button highlighted",
    caption: "Review the form, then select Submit at the bottom of the page.",
  },
};

/**
 * Short, stable aliases for images whose filename is not the name articles use.
 * Prefer referencing the filename id directly; aliases exist for ids that were
 * in use before images became self-registering.
 */
const imageAliases: Record<string, string> = {
  dashboard: "snoopy-doghouse",
  validation: "snoopy-suppertime",
  team: "snoopy-gang",
};

// Bundler-resolved URLs for every optimised variant on disk. Adding a file to
// the optimised output is all it takes to appear here.
const optimizedUrls = import.meta.glob("../assets/media/optimized/**/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const READING_SUFFIX = "-768";
const intrinsicSizes = manifest as Record<string, { width: number; height: number }>;

type Variants = { full?: string; reading?: string };
const variantsById = new Map<string, Variants>();

for (const [path, url] of Object.entries(optimizedUrls)) {
  const filename = path.slice(path.lastIndexOf("/") + 1).replace(/\.webp$/, "");
  const isReading = filename.endsWith(READING_SUFFIX);
  const id = isReading ? filename.slice(0, -READING_SUFFIX.length) : filename;
  const entry = variantsById.get(id) ?? {};
  if (isReading) entry.reading = url;
  else entry.full = url;
  variantsById.set(id, entry);
}

function buildRef(id: string, variants: Variants): ImageRef | null {
  if (!variants.full) return null;
  const size = intrinsicSizes[id];
  // Alt text written in a drop-in Markdown article wins for its own images;
  // anything hand-authored here still overrides it.
  const meta = imageMeta[id] ?? importedImageMeta[id];
  return {
    src: variants.full,
    ...(size ?? {}),
    ...(variants.reading && size
      ? { srcSet: responsiveWebp(variants.reading, variants.full, size.width) }
      : {}),
    // An image with no authored metadata still renders; `validate:content`
    // reports the empty alt text rather than letting it ship silently.
    alt: meta?.alt ?? "",
    ...(meta?.caption ? { caption: meta.caption } : {}),
    ...(meta?.presentation ? { presentation: meta.presentation } : {}),
  };
}

const discovered: Record<string, ImageRef> = {};
for (const [id, variants] of variantsById) {
  const ref = buildRef(id, variants);
  if (ref) discovered[id] = ref;
}

export const imageIds = {
  dashboard: "dashboard",
  validation: "validation",
  team: "team",
  storeCharactersMenu: "peanuts-store-characters-menu",
  storeSnoopyCollection: "peanuts-store-snoopy-collection",
  supportFooterLink: "peanuts-support-footer-link",
  supportCenterHome: "peanuts-support-center-home",
  supportMessageLink: "peanuts-support-message-link",
  supportSubmitRequest: "peanuts-support-submit-request",
  supportRequestFields: "peanuts-support-request-fields",
  supportSearchHelp: "peanuts-support-search-help",
  supportOpenRequestForm: "peanuts-support-open-request-form",
  supportCompleteRequestForm: "peanuts-support-complete-request-form",
  supportSubmitButton: "peanuts-support-submit-button",
  lessonStep1: "lesson-step-1",
  lessonStep2: "lesson-step-2",
  lessonStep3: "lesson-step-3",
} as const;

export type ImageId = (typeof imageIds)[keyof typeof imageIds];

/** CDN-hosted step animations. These have no local file to discover. */
const cdnImages: Record<string, ImageRef> = {
  [imageIds.lessonStep1]: {
    src: stepUrl(lessonStep1),
    alt: "Step 1: Click the Activities button in the homepage top navigation",
    caption: "Step 1 — find the Activities button in the top navigation.",
  },
  [imageIds.lessonStep2]: {
    src: stepUrl(lessonStep2),
    alt: "Step 2: Open Peanuts Lesson Plan from the Activities hub",
    caption: "Step 2 — open the Peanuts Lesson Plan tile.",
  },
  [imageIds.lessonStep3]: {
    src: stepUrl(lessonStep3),
    alt: "Step 3: Scroll to Solar Science and click Parent Guide (Ages 4–7)",
    caption: "Step 3 — pick Parent Guide (Ages 4–7) under Solar Science.",
  },
};

const aliased: Record<string, ImageRef> = {};
for (const [alias, target] of Object.entries(imageAliases)) {
  const ref = discovered[target];
  if (ref) aliased[alias] = { ...ref, ...imageMeta[alias] };
}

export const images: Record<string, ImageRef> = {
  ...discovered,
  ...aliased,
  ...cdnImages,
};

/** @deprecated Prefer `ImageId`; retained for existing imports. */
export type ImageKey = ImageId;

export interface StepImagePair {
  action: ImageId;
  outcome: ImageId;
}

/** Keeps an article's action/outcome image pairs type-safe and easy to replace. */
export function defineStepImages<const T extends Record<string, StepImagePair>>(stepImages: T) {
  return stepImages;
}

export function getImage(key: string): ImageRef | undefined {
  return images[key];
}
