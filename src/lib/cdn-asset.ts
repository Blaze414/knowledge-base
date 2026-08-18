/**
 * Centralized builder for Lovable CDN asset URLs.
 *
 * Every `.asset.json` pointer ships a `url` field of the canonical shape
 * `/__l5e/assets-v1/{asset_id}/{filename}`. Rather than letting call sites
 * reach into `.url` directly (and risk drifting on base path, query params,
 * or cache-busting strategy), they should funnel through `cdnAssetUrl()`.
 *
 * This keeps the base path in one place and provides a single hook for:
 *   - appending shared query params (e.g. `?v=` for cache busting)
 *   - swapping the CDN host in tests
 *   - validating pointer shape at runtime
 */

/** Minimal shape of a `.asset.json` pointer file. */
export interface CdnAssetPointer {
  url: string;
  asset_id?: string;
  original_filename?: string;
  content_type?: string;
  size?: number;
}

/** Canonical base path served by Lovable's asset infrastructure. */
export const CDN_ASSET_BASE = "/__l5e/assets-v1";

export interface CdnAssetOptions {
  /** Extra query params merged onto the URL (values are stringified). */
  params?: Record<string, string | number | undefined>;
}

/**
 * Build a CDN URL from an asset pointer. Pass options to append shared
 * query params (e.g. version pins) without rewriting every call site.
 */
export function cdnAssetUrl(pointer: CdnAssetPointer, options: CdnAssetOptions = {}): string {
  if (!pointer || typeof pointer.url !== "string" || pointer.url.length === 0) {
    throw new Error("cdnAssetUrl: pointer is missing a `url` field");
  }

  const { params } = options;
  if (!params) return pointer.url;

  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return pointer.url;

  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  return pointer.url.includes("?") ? `${pointer.url}&${qs}` : `${pointer.url}?${qs}`;
}
