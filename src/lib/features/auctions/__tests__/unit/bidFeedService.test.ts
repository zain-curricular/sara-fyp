// ============================================================================
// Unit tests — public bid feed pseudonymous bidder refs
// ============================================================================

import { describe, it, expect } from 'vitest'

import { bidderRefForPublicFeed } from '@/lib/features/auctions/_utils/bidFeedService'

describe('bidderRefForPublicFeed', () => {
	it('is stable for the same listing and bidder', () => {
		const a = bidderRefForPublicFeed(
			'00000000-0000-4000-8000-000000000001',
			'00000000-0000-4000-8000-000000000002',
		)
		const b = bidderRefForPublicFeed(
			'00000000-0000-4000-8000-000000000001',
			'00000000-0000-4000-8000-000000000002',
		)
		expect(a).toBe(b)
		expect(a).toHaveLength(16)
	})

	it('differs when listing id differs', () => {
		const listingA = bidderRefForPublicFeed(
			'00000000-0000-4000-8000-000000000001',
			'00000000-0000-4000-8000-000000000002',
		)
		const listingB = bidderRefForPublicFeed(
			'11111111-1111-4111-8111-111111111111',
			'00000000-0000-4000-8000-000000000002',
		)
		expect(listingA).not.toBe(listingB)
	})

	it('differs when bidder id differs', () => {
		const bidderA = bidderRefForPublicFeed(
			'00000000-0000-4000-8000-000000000001',
			'00000000-0000-4000-8000-000000000002',
		)
		const bidderB = bidderRefForPublicFeed(
			'00000000-0000-4000-8000-000000000001',
			'11111111-1111-4111-8111-111111111111',
		)
		expect(bidderA).not.toBe(bidderB)
	})
})
