// ============================================================================
// Favorites & viewed history — server barrel (orchestrators only)
// ============================================================================
//
// Low-level DAFs are exported from `./dataAccess` for tests and rare internal use.

import 'server-only'

export { toggleFavorite, type ToggleFavoriteResult } from './_utils/toggleFavorite'
export { listMyFavorites } from './_utils/listMyFavorites'
export { isListingFavorited } from './_utils/isFavorited'
export { recordListingView } from './_utils/recordListingView'
export { listMyRecentViews } from './_utils/listRecentViews'
