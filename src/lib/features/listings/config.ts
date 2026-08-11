/** Search tuning — aligned with marketplace `listings/search/config`. */

export const SEARCH_Q_MAX = 80;
export const SEARCH_Q_TSVECTOR_MIN = 3;
export const SEARCH_PAGE_MAX = 100;
export const SEARCH_LIMIT_DEFAULT = 20;
export const SEARCH_LIMIT_MAX = 50;

/**
 * Listing photo upload limits.
 *
 * These mirror the `listing-images` Storage bucket config (public, 10 MB,
 * jpeg/png/webp) and the `listing_images.valid_position` check constraint
 * (`position >= 0 AND position < 10`). Keep all three in sync.
 */

export const IMAGE_BUCKET = "listing-images";
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_PER_LISTING = 10;
