// ============================================================================
// Favorites — data-access re-export (tests + orchestrators; not in server barrel)
// ============================================================================

import 'server-only'

export {
	getFavoriteExists,
	insertFavorite,
	deleteFavorite,
	listFavoriteLinksForUser,
	type FavoriteLinkRow,
	type PaginatedFavoriteLinks,
} from './_data-access/favoritesDafs'

export {
	upsertViewedListing,
	listViewedLinksForUser,
	type ViewedLinkRow,
	type PaginatedViewedLinks,
} from './_data-access/viewedListingsDafs'
