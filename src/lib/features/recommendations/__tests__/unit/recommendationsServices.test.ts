// ============================================================================
// Unit tests — recommendations services (mocked DAFs)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/listings/core/services', () => ({
	getListingById: vi.fn(),
	listListingsByIds: vi.fn(),
}))

vi.mock('@/lib/features/recommendations/_data-access/recommendationsDafs', () => ({
	countViewedListingsForUser: vi.fn(),
	listActiveListingsInCategories: vi.fn(),
	listListingsByAffinityCategories: vi.fn(),
	listSimilarListings: vi.fn(),
	listTrendingListingIdsFromMv: vi.fn(),
}))

vi.mock('@/lib/features/recommendations/_utils/forMeCache', () => ({
	cacheKeyForMe: vi.fn((userId: string, platform: string) => `${userId}:${platform}`),
	getForMeFromCache: vi.fn(),
	setForMeCache: vi.fn(),
}))

vi.mock('@/lib/features/recommendations/_utils/coldStartForMe', () => ({
	pickColdStartCategoryIds: vi.fn(),
}))

import * as listings from '@/lib/features/listings/core/services'
import * as dafs from '@/lib/features/recommendations/_data-access/recommendationsDafs'
import * as forMeCache from '@/lib/features/recommendations/_utils/forMeCache'
import * as coldStart from '@/lib/features/recommendations/_utils/coldStartForMe'
import {
	listSimilarForListing,
	listTrending,
	listForMe,
} from '@/lib/features/recommendations/services'
import type { ListingRow } from '@/lib/supabase/database.types'

const L1 = '00000000-0000-4000-8000-000000000001'
const CAT = '00000000-0000-4000-8000-0000000000c1'

function listing(partial: Partial<ListingRow> & Pick<ListingRow, 'id'>): ListingRow {
	return {
		user_id: 'u-seller',
		platform: 'mobile',
		category_id: CAT,
		model_id: null,
		title: 'x',
		description: null,
		ai_description: null,
		sale_type: 'fixed',
		price: 100,
		is_negotiable: false,
		condition: 'good',
		details: {},
		ai_rating: null,
		city: 'c',
		area: null,
		status: 'active',
		current_bid: null,
		current_bidder_id: null,
		search_vector: null,
		published_at: new Date().toISOString(),
		expires_at: null,
		sold_at: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		deleted_at: null,
		favorite_count: 0,
		...partial,
	}
}

describe('listSimilarForListing', () => {
	beforeEach(() => {
		vi.mocked(listings.getListingById).mockReset()
		vi.mocked(dafs.listSimilarListings).mockReset()
	})

	it('returns empty when source listing is not active', async () => {
		vi.mocked(listings.getListingById).mockResolvedValue({
			data: listing({ id: L1, status: 'draft' }),
			error: null,
		})
		const { data, error, listingNotFound } = await listSimilarForListing(L1, { limit: 10 })
		expect(error).toBeNull()
		expect(listingNotFound).toBeFalsy()
		expect(data).toEqual([])
		expect(dafs.listSimilarListings).not.toHaveBeenCalled()
	})

	it('sets listingNotFound when no row exists', async () => {
		vi.mocked(listings.getListingById).mockResolvedValue({ data: null, error: null })
		const { data, error, listingNotFound } = await listSimilarForListing(L1, { limit: 10 })
		expect(error).toBeNull()
		expect(listingNotFound).toBe(true)
		expect(data).toBeNull()
		expect(dafs.listSimilarListings).not.toHaveBeenCalled()
	})

	it('delegates to listSimilarListings for active listing', async () => {
		vi.mocked(listings.getListingById).mockResolvedValue({
			data: listing({ id: L1, price: 200, category_id: CAT }),
			error: null,
		})
		vi.mocked(dafs.listSimilarListings).mockResolvedValue({ data: [listing({ id: 'l2' })], error: null })
		const { data, error, listingNotFound } = await listSimilarForListing(L1, { limit: 5 })
		expect(error).toBeNull()
		expect(listingNotFound).toBeFalsy()
		expect(data).toHaveLength(1)
		expect(dafs.listSimilarListings).toHaveBeenCalledWith(
			expect.objectContaining({
				excludeListingId: L1,
				categoryId: CAT,
				limit: 5,
			}),
		)
	})
})

describe('listTrending', () => {
	beforeEach(() => {
		vi.mocked(dafs.listTrendingListingIdsFromMv).mockReset()
		vi.mocked(listings.listListingsByIds).mockReset()
	})

	it('reorders listings to match mv order', async () => {
		const a = listing({ id: 'aaaaaaaa-aaaa-4000-8000-000000000001' })
		const b = listing({ id: 'bbbbbbbb-bbbb-4000-8000-000000000002' })
		vi.mocked(dafs.listTrendingListingIdsFromMv).mockResolvedValue({
			data: [
				{ listing_id: b.id, platform: 'mobile' as const, trend_score: 2 },
				{ listing_id: a.id, platform: 'mobile' as const, trend_score: 1 },
			],
			error: null,
		})
		vi.mocked(listings.listListingsByIds).mockResolvedValue({ data: [a, b], error: null })
		const { data } = await listTrending({ platform: 'mobile', limit: 10 })
		expect(data?.map((x) => x.id)).toEqual([b.id, a.id])
	})

	it('drops non-active rows so length may be below limit', async () => {
		const active = listing({ id: 'aaaaaaaa-aaaa-4000-8000-000000000001', status: 'active' })
		const draft = listing({ id: 'bbbbbbbb-bbbb-4000-8000-000000000002', status: 'draft' })
		vi.mocked(dafs.listTrendingListingIdsFromMv).mockResolvedValue({
			data: [
				{ listing_id: draft.id, platform: 'mobile' as const, trend_score: 2 },
				{ listing_id: active.id, platform: 'mobile' as const, trend_score: 1 },
			],
			error: null,
		})
		vi.mocked(listings.listListingsByIds).mockResolvedValue({ data: [active, draft], error: null })
		const { data } = await listTrending({ platform: 'mobile', limit: 10 })
		expect(data).toHaveLength(1)
		expect(data?.[0]?.id).toBe(active.id)
	})
})

describe('listForMe', () => {
	const uid = '00000000-0000-4000-8000-0000000000u1'

	beforeEach(() => {
		vi.mocked(forMeCache.getForMeFromCache).mockReset()
		vi.mocked(forMeCache.setForMeCache).mockReset()
		vi.mocked(dafs.countViewedListingsForUser).mockReset()
		vi.mocked(dafs.listListingsByAffinityCategories).mockReset()
		vi.mocked(dafs.listActiveListingsInCategories).mockReset()
		vi.mocked(coldStart.pickColdStartCategoryIds).mockReset()
		vi.mocked(forMeCache.getForMeFromCache).mockReturnValue(null)
	})

	it('returns cached rows without hitting DB', async () => {
		const cached = [listing({ id: L1 })]
		vi.mocked(forMeCache.getForMeFromCache).mockReturnValue(cached)
		const { data, error } = await listForMe(uid, { platform: 'mobile', limit: 10 })
		expect(error).toBeNull()
		expect(data).toBe(cached)
		expect(dafs.countViewedListingsForUser).not.toHaveBeenCalled()
	})

	it('uses affinity when view count >= threshold', async () => {
		vi.mocked(dafs.countViewedListingsForUser).mockResolvedValue({ data: 5, error: null })
		const rows = [listing({ id: L1 })]
		vi.mocked(dafs.listListingsByAffinityCategories).mockResolvedValue({ data: rows, error: null })
		const { data, error } = await listForMe(uid, { platform: 'mobile', limit: 10 })
		expect(error).toBeNull()
		expect(data).toEqual(rows)
		expect(forMeCache.setForMeCache).toHaveBeenCalled()
		expect(coldStart.pickColdStartCategoryIds).not.toHaveBeenCalled()
	})

	it('returns error when view count query fails', async () => {
		vi.mocked(dafs.countViewedListingsForUser).mockResolvedValue({
			data: null,
			error: new Error('db'),
		})
		const { data, error } = await listForMe(uid, { platform: 'mobile', limit: 10 })
		expect(data).toBeNull()
		expect(error).toBeDefined()
	})

	it('cold-start then affinity fallback when AI categories empty', async () => {
		vi.mocked(dafs.countViewedListingsForUser).mockResolvedValue({ data: 1, error: null })
		vi.mocked(coldStart.pickColdStartCategoryIds).mockResolvedValue({
			data: null,
			error: new Error('AI_PICK_EMPTY'),
		})
		const rows = [listing({ id: L1 })]
		vi.mocked(dafs.listListingsByAffinityCategories).mockResolvedValue({ data: rows, error: null })
		const { data, error } = await listForMe(uid, { platform: 'mobile', limit: 10 })
		expect(error).toBeNull()
		expect(data).toEqual(rows)
	})
})
