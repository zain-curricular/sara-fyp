// ============================================================================
// Unit tests — for-me in-memory cache
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import type { ListingRow } from '@/lib/supabase/database.types'

import {
	getForMeFromCache,
	setForMeCache,
	cacheKeyForMe,
	_clearForMeCacheForTests,
} from '@/lib/features/recommendations/_utils/forMeCache'

const baseListing = (id: string): ListingRow => ({
	id,
	user_id: 'u1',
	platform: 'mobile',
	category_id: '00000000-0000-4000-8000-0000000000c1',
	model_id: null,
	title: 't',
	description: null,
	ai_description: null,
	sale_type: 'fixed',
	price: 1,
	is_negotiable: false,
	condition: 'good',
	details: {},
	ai_rating: null,
	city: 'x',
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
})

describe('forMeCache', () => {
	beforeEach(() => {
		_clearForMeCacheForTests()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		_clearForMeCacheForTests()
	})

	it('cacheKeyForMe joins user and platform', () => {
		expect(cacheKeyForMe('user-a', 'mobile')).toBe('user-a:mobile')
	})

	it('returns null after TTL', () => {
		const key = cacheKeyForMe('u1', 'mobile')
		setForMeCache(key, [baseListing('l1')])
		expect(getForMeFromCache(key)).toHaveLength(1)
		vi.advanceTimersByTime(60 * 60 * 1000 + 1)
		expect(getForMeFromCache(key)).toBeNull()
	})
})
