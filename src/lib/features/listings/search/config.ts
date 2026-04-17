// ============================================================================
// Listings / search — constants
// ============================================================================

/** Max characters allowed in free-text search `q` param. */
export const SEARCH_Q_MAX = 80

/** Minimum `q` length before switching from ilike fallback to tsvector. */
export const SEARCH_Q_TSVECTOR_MIN = 3

/** Hard upper bound on `page` parameter to cap deep-paging cost. */
export const SEARCH_PAGE_MAX = 100

/** Default result page size. */
export const SEARCH_LIMIT_DEFAULT = 20

/** Maximum allowed `limit` per page. */
export const SEARCH_LIMIT_MAX = 50
