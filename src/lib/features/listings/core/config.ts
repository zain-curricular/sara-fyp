// ============================================================================
// Listings / core — constants
// ============================================================================
//
// Quotas and defaults shared by listing orchestrators. Kept small and
// client-safe so schemas + UI can read the same numbers.

/** Maximum active + pending_review listings when no subscription row exists. */
export const DEFAULT_FREE_LISTING_LIMIT = 5

/** Upper bound on user-supplied limit for the seller dashboard list. */
export const OWN_LISTINGS_PAGE_MAX = 500
