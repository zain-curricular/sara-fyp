// ============================================================================
// Product catalog — constants
// ============================================================================

/** Maximum length of a model search `q` parameter. */
export const CATALOG_SEARCH_Q_MAX = 80

/** Minimum `q` length before running model search (avoid full-table scans). */
export const CATALOG_SEARCH_Q_MIN = 2

/** Upper bound on unpaginated list endpoints (categories/brands/models). */
export const CATALOG_LIST_MAX = 500

/** Maximum rows returned by `searchModelsByName`. */
export const CATALOG_SEARCH_MODELS_LIMIT = 50
