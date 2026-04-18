// ============================================================================
// Recommendations — limits and thresholds (see 86ex9wugf)
// ============================================================================
//
// mv_trending_listings: 20260416000014_views.sql; refresh cron: 20260416000016_cron.sql
// viewed_listings cap: enforced in DB trigger (see favorites/viewed migrations).

/** Max items returned by recommendation list endpoints (query clamped in schemas). */
export const RECOMMENDATIONS_MAX_LIMIT = 20

/** Personalised: SQL affinity once user has this many viewed rows. */
export const RECOMMENDATIONS_AFFINITY_MIN_VIEWS = 5

/** In-memory cache TTL for GET /recommendations/for-me (ms). */
export const FOR_ME_CACHE_TTL_MS = 60 * 60 * 1000

/** Max entries in for-me LRU cache (avoids unbounded growth). */
export const FOR_ME_CACHE_MAX_ENTRIES = 5000

/** Similar listings: price band as multiplier around source listing price. */
export const SIMILAR_PRICE_BAND_LOW = 0.75
export const SIMILAR_PRICE_BAND_HIGH = 1.35
