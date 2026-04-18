// ============================================================================
// Recommendations — data access (admin client, { data, error }, never throw)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { ListingRow, MvTrendingListingViewRow, PlatformType } from '@/lib/supabase/database.types'

/**
 * Similar listings: same category, price band, active only. Excludes source id.
 */
export async function listSimilarListings(input: {
	excludeListingId: string
	categoryId: string
	priceMin: number
	priceMax: number
	limit: number
}): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listings')
		.select('*')
		.eq('status', 'active')
		.is('deleted_at', null)
		.neq('id', input.excludeListingId)
		.eq('category_id', input.categoryId)
		.gte('price', input.priceMin)
		.lte('price', input.priceMax)
		.order('created_at', { ascending: false })
		.limit(input.limit)

	if (error) {
		logDatabaseError('recommendations:listSimilarListings', { categoryId: input.categoryId }, error)
	}
	return { data: data as ListingRow[] | null, error }
}

/**
 * Reads pre-ranked ids from `mv_trending_listings` (refreshed on cron).
 */
export async function listTrendingListingIdsFromMv(
	platform: PlatformType,
	limit: number,
): Promise<{ data: MvTrendingListingViewRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('mv_trending_listings')
		.select('listing_id, platform, trend_score')
		.eq('platform', platform)
		.order('trend_score', { ascending: false })
		.limit(limit)

	if (error) {
		logDatabaseError('recommendations:listTrendingListingIdsFromMv', { platform }, error)
	}
	return { data: data as MvTrendingListingViewRow[] | null, error }
}

export async function countViewedListingsForUser(
	userId: string,
): Promise<{ data: number | null; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('viewed_listings')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)

	if (error) {
		logDatabaseError('recommendations:countViewedListingsForUser', { userId }, error)
		return { data: null, error }
	}
	return { data: count ?? 0, error: null }
}

/**
 * Distinct category ids from the user's viewed + favorited active listings.
 */
async function collectAffinityCategoryIds(userId: string): Promise<{ ids: string[]; error: unknown }> {
	const { data: viewed, error: vErr } = await getAdmin()
		.from('viewed_listings')
		.select('listing_id')
		.eq('user_id', userId)
		.limit(500)

	if (vErr) {
		logDatabaseError('recommendations:collectAffinityCategoryIds:viewed', { userId }, vErr)
		return { ids: [], error: vErr }
	}

	const { data: favs, error: fErr } = await getAdmin()
		.from('favorites')
		.select('listing_id')
		.eq('user_id', userId)
		.limit(500)

	if (fErr) {
		logDatabaseError('recommendations:collectAffinityCategoryIds:favorites', { userId }, fErr)
		return { ids: [], error: fErr }
	}

	const listingIds = [
		...new Set([
			...(viewed ?? []).map((r) => r.listing_id as string),
			...(favs ?? []).map((r) => r.listing_id as string),
		]),
	]

	if (listingIds.length === 0) {
		return { ids: [], error: null }
	}

	const { data: rows, error: lErr } = await getAdmin()
		.from('listings')
		.select('category_id')
		.in('id', listingIds)
		.eq('status', 'active')
		.is('deleted_at', null)

	if (lErr) {
		logDatabaseError('recommendations:collectAffinityCategoryIds:listings', { userId }, lErr)
		return { ids: [], error: lErr }
	}

	const cats = [...new Set((rows ?? []).map((r) => r.category_id as string))]
	return { ids: cats, error: null }
}

/**
 * Active listings in any of the affinity categories, newest first.
 */
export async function listListingsByAffinityCategories(input: {
	userId: string
	platform: PlatformType
	limit: number
}): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const { ids: categoryIds, error: cErr } = await collectAffinityCategoryIds(input.userId)
	if (cErr) {
		return { data: null, error: cErr }
	}
	if (categoryIds.length === 0) {
		return { data: [], error: null }
	}

	const { data, error } = await getAdmin()
		.from('listings')
		.select('*')
		.eq('status', 'active')
		.is('deleted_at', null)
		.eq('platform', input.platform)
		.in('category_id', categoryIds)
		.order('created_at', { ascending: false })
		.limit(input.limit)

	if (error) {
		logDatabaseError('recommendations:listListingsByAffinityCategories', { userId: input.userId }, error)
	}
	return { data: data as ListingRow[] | null, error }
}

/**
 * Cold-start / category picks: newest active listings in given categories.
 */
export async function listActiveListingsInCategories(input: {
	categoryIds: string[]
	platform: PlatformType
	limit: number
}): Promise<{ data: ListingRow[] | null; error: unknown }> {
	if (input.categoryIds.length === 0) {
		return { data: [], error: null }
	}

	const { data, error } = await getAdmin()
		.from('listings')
		.select('*')
		.eq('status', 'active')
		.is('deleted_at', null)
		.eq('platform', input.platform)
		.in('category_id', input.categoryIds)
		.order('created_at', { ascending: false })
		.limit(input.limit)

	if (error) {
		logDatabaseError(
			'recommendations:listActiveListingsInCategories',
			{ count: input.categoryIds.length },
			error,
		)
	}
	return { data: data as ListingRow[] | null, error }
}
