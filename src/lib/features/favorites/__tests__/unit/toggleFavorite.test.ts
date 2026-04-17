// ============================================================================
// Unit tests — toggleFavorite
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/listings/core/services', () => ({
	getListingById: vi.fn(),
}))

vi.mock('@/lib/features/favorites/dataAccess', () => ({
	getFavoriteExists: vi.fn(),
	deleteFavorite: vi.fn(),
	insertFavorite: vi.fn(),
}))

import { toggleFavorite } from '@/lib/features/favorites/_utils/toggleFavorite'
import * as listings from '@/lib/features/listings/core/services'
import * as da from '@/lib/features/favorites/dataAccess'
import type { ListingRow } from '@/lib/supabase/database.types'

const baseListing: ListingRow = {
	id: '00000000-0000-4000-8000-000000000099',
	user_id: '00000000-0000-4000-8000-000000000001',
	platform: 'mobile',
	category_id: '00000000-0000-4000-8000-000000000002',
	model_id: null,
	title: 'L',
	description: null,
	ai_description: null,
	sale_type: 'fixed',
	price: 10,
	is_negotiable: false,
	condition: 'good',
	details: {},
	ai_rating: null,
	city: 'X',
	area: null,
	status: 'active',
	current_bid: null,
	current_bidder_id: null,
	search_vector: null,
	published_at: null,
	expires_at: null,
	sold_at: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	deleted_at: null,
	favorite_count: 0,
}

describe('toggleFavorite', () => {
	beforeEach(() => {
		vi.mocked(listings.getListingById).mockReset()
		vi.mocked(da.getFavoriteExists).mockReset()
		vi.mocked(da.deleteFavorite).mockReset()
		vi.mocked(da.insertFavorite).mockReset()
	})

	it('removes favorite when present', async () => {
		vi.mocked(listings.getListingById).mockResolvedValue({ data: baseListing, error: null })
		vi.mocked(da.getFavoriteExists).mockResolvedValue({ data: true, error: null })
		vi.mocked(da.deleteFavorite).mockResolvedValue({ error: null })

		const { data, error } = await toggleFavorite('u1', baseListing.id)

		expect(error).toBeNull()
		expect(data?.is_favorited).toBe(false)
		expect(da.insertFavorite).not.toHaveBeenCalled()
	})

	it('adds favorite when absent', async () => {
		vi.mocked(listings.getListingById).mockResolvedValue({ data: baseListing, error: null })
		vi.mocked(da.getFavoriteExists).mockResolvedValue({ data: false, error: null })
		vi.mocked(da.insertFavorite).mockResolvedValue({ error: null })

		const { data, error } = await toggleFavorite('u1', baseListing.id)

		expect(error).toBeNull()
		expect(data?.is_favorited).toBe(true)
	})
})
