/**
 * Image utility — Supabase-aware image URL optimizer
 * ====================================================
 * Converts any Supabase Storage public URL into a responsive,
 * transformed URL using Supabase's built-in image transformation API.
 *
 * Supabase's transformation endpoint:
 *   /storage/v1/render/image/public/<path>?width=N&quality=N&format=webp
 *
 * This is served by Cloudflare CDN with proper cache-control headers
 * when the transformation parameters are consistent.
 *
 * External URLs (Unsplash, Wikipedia, etc.) are returned unchanged.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_STORAGE_ORIGIN = "https://fyxpczacexydrzpqipfy.supabase.co";
const SUPABASE_PUBLIC_PREFIX = `${SUPABASE_STORAGE_ORIGIN}/storage/v1/object/public/`;
const SUPABASE_RENDER_PREFIX = `${SUPABASE_STORAGE_ORIGIN}/storage/v1/render/image/public/`;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75&fm=webp&auto=format";

/**
 * Returns true if the URL is a Supabase Storage object URL.
 */
function isSupabaseUrl(url) {
  return typeof url === "string" && url.startsWith(SUPABASE_PUBLIC_PREFIX);
}

/**
 * Converts a Supabase Storage public URL to a transformation-ready render URL.
 * Preserves the storage path, appending width, quality, and format params.
 *
 * @param {string} url      - Original Supabase public URL
 * @param {number} width    - Target width in pixels
 * @param {number} quality  - JPEG/WebP quality 1-100 (default: 80)
 * @returns {string}
 */
function buildSupabaseTransformUrl(url, width, quality = 80) {
  const storagePath = url.replace(SUPABASE_PUBLIC_PREFIX, "");
  return `${SUPABASE_RENDER_PREFIX}${storagePath}?width=${width}&quality=${quality}&format=webp`;
}

/**
 * Resolve any image URL to an optimized production URL.
 * For Supabase images this adds transformation parameters.
 * For other URLs (CDN, Unsplash, data:) passes through untouched.
 *
 * @param {string|null|undefined} url  - Raw image URL from API
 * @param {number} width               - Desired display width (default: 800)
 * @param {number} quality             - Image quality 1-100 (default: 80)
 * @returns {string}
 */
export function resolveImageUrl(url, width = 800, quality = 80) {
  if (!url || url === "undefined" || url === "null") return FALLBACK_IMAGE;

  // Already a data URI — return as-is
  if (url.startsWith("data:")) return url;

  // Supabase Storage URL — use transformation API for WebP + resize
  if (isSupabaseUrl(url)) {
    return buildSupabaseTransformUrl(url, width, quality);
  }

  // External absolute URL (Unsplash, Wikipedia, etc.) — return unchanged
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative path — prepend backend base URL
  const base =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://vrital-api.onrender.com"
      : "http://127.0.0.1:8000");
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/**
 * Build a srcSet string for responsive Supabase images.
 * Returns undefined for non-Supabase URLs (no transformation available).
 *
 * Usage:
 *   <img src={resolveImageUrl(url, 800)} srcSet={buildSrcSet(url)} sizes="..." />
 *
 * @param {string|null|undefined} url - Raw image URL from API
 * @param {number} quality            - Quality for all breakpoints (default: 80)
 * @returns {string|undefined}
 */
export function buildSrcSet(url, quality = 80) {
  if (!url || !isSupabaseUrl(url)) return undefined;
  const widths = [400, 800, 1200];
  return widths
    .map((w) => `${buildSupabaseTransformUrl(url, w, quality)} ${w}w`)
    .join(", ");
}
