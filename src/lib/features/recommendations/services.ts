// ============================================================================
// Recommendations — server orchestration (similar, trending, for-me)
// ============================================================================

import 'server-only'

import { getListingById, listListingsByIds } from '@/lib/features/listings/core/services'
import type { ListingRow, PlatformType } from '@/lib/supabase/database.types'

import {
	countViewedListingsForUser,
	listActiveListingsInCategories,
	listListingsByAffinityCategories,
	listSimilarListings,
	listTrendingListingIdsFromMv,
} from './_data-access/recommendationsDafs'
import { pickColdStartCategoryIds } from './_utils/coldStartForMe'
import {
	cacheKeyForMe,
	getForMeFromCache,
	setForMeCache,
} from './_utils/forMeCache'
import {
	RECOMMENDATIONS_AFFINITY_MIN_VIEWS,
	SIMILAR_PRICE_BAND_HIGH,
	SIMILAR_PRICE_BAND_LOW,
} from './config'
import type { ForMeQuery, SimilarListingsQuery, TrendingQuery } from './schemas'
import type { TrustedUserId } from '@/lib/features/ai-engine'

function reorderListingsByIdOrder(rows: ListingRow[], ids: string[]): ListingRow[] {
	const idx = new Map(ids.map((id, i) => [id, i]))
	return [...rows].sort((a, b) => (idx.get(a.id) ?? 999) - (idx.get(b.id) ?? 999))
}

export async function listSimilarForListing(
	listingId: string,
	query: SimilarListingsQuery,
): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const { data: source, error: sErr } = await getListingById(listingId)
	if (sErr) {
		return { data: null, error: sErr }
	}
	if (!source || source.deleted_at || source.status !== 'active') {
		return { data: [], error: null }
	}

	const priceMin = Math.max(0, Math.floor(source.price * SIMILAR_PRICE_BAND_LOW))
	const priceMax = Math.ceil(source.price * SIMILAR_PRICE_BAND_HIGH)

	return listSimilarListings({
		excludeListingId: source.id,
		categoryId: source.category_id,
		priceMin,
		priceMax,
		limit: query.limit,
	})
}

export async function listTrending(
	query: TrendingQuery,
): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const { data: mv, error: mvErr } = await listTrendingListingIdsFromMv(query.platform, query.limit)
	if (mvErr) {
		return { data: null, error: mvErr }
	}
	if (!mv?.length) {
		return { data: [], error: null }
	}

	const ids = mv.map((m) => m.listing_id)
	const { data: rows, error: lErr } = await listListingsByIds(ids)
	if (lErr) {
		return { data: null, error: lErr }
	}

	const active = (rows ?? []).filter((r) => r.status === 'active' && !r.deleted_at)
	const ordered = reorderListingsByIdOrder(active, ids)
	return { data: ordered.slice(0, query.limit), error: null }
}

export async function listForMe(
	userId: TrustedUserId,
	query: ForMeQuery,
): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const key = cacheKeyForMe(userId, query.platform)
	const cached = getForMeFromCache(key)
	if (cached) {
		return { data: cached, error: null }
	}

	const { data: viewCount, error: vcErr } = await countViewedListingsForUser(userId)
	if (vcErr) {
		return { data: null, error: vcErr }
	}

	if (viewCount >= RECOMMENDATIONS_AFFINITY_MIN_VIEWS) {
		const { data, error } = await listListingsByAffinityCategories({
			userId,
			platform: query.platform,
			limit: query.limit,
		})
		if (data != null && !error && data.length > 0) {
			setForMeCache(key, data)
		}
		return { data, error }
	}

	const cold = await pickColdStartCategoryIds({
		platform: query.platform as PlatformType,
		userId,
	})

	let listings: ListingRow[] | null = null
	let err: unknown = cold.error

	if (!cold.error && cold.data?.length) {
		const { data: byCat, error: lcErr } = await listActiveListingsInCategories({
			categoryIds: cold.data,
			platform: query.platform,
			limit: query.limit,
		})
		if (!lcErr && byCat?.length) {
			listings = byCat
			err = null
		}
	}

	if (!listings?.length) {
		const { data: aff, error: aErr } = await listListingsByAffinityCategories({
			userId,
			platform: query.platform,
			limit: query.limit,
		})
		if (aErr) {
			return { data: null, error: aErr }
		}
		listings = aff ?? []
		err = null
	}

	if (listings?.length && !err) {
		setForMeCache(key, listings)
	}

	return { data: listings, error: err }
}
