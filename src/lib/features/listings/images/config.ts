// ============================================================================
// Listings — image upload limits
// ============================================================================

/** Matches storage bucket `file_size_limit` (10 MB). */
export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** Accepted image MIME types for listing photos. */
export const LISTING_IMAGE_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Maximum listing_images rows per listing (matches storage bucket + product rule). */
export const LISTING_IMAGES_MAX = 10
