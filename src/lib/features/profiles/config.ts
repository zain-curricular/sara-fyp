// ============================================================================
// Profiles — constants
// ============================================================================
//
// Limits aligned with Supabase storage bucket config (avatars) and product
// rules for uploads.

/**
 * Maximum avatar file size in bytes (matches `avatars` bucket limit).
 */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

/**
 * Allowed Content-Type values for avatar uploads.
 */
export const AVATAR_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
