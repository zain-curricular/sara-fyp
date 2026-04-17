// ============================================================================
// Listings — search orchestration (maps query → DAF)
// ============================================================================

import { searchListings } from '@/lib/features/listings/core/services'
import type { ListingsSearchQuery } from '@/lib/features/listings/search/schemas'

/**
 * Runs public listing search with validated query params.
 */
export async function runListingsSearch(query: ListingsSearchQuery) {
	return searchListings({
		q: query.q,
		platform: query.platform,
		categoryId: query.category_id,
		modelId: query.model_id,
		city: query.city,
		priceMin: query.price_min,
		priceMax: query.price_max,
		page: query.page,
		limit: query.limit,
	})
}
