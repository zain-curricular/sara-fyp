// ============================================================================
// Unit tests — auction Zod schemas
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	createAuctionConfigBodySchema,
	patchAuctionConfigBodySchema,
	placeBidBodySchema,
} from '@/lib/features/auctions/schemas'

describe('createAuctionConfigBodySchema', () => {
	it('accepts a valid payload', () => {
		const parsed = createAuctionConfigBodySchema.safeParse({
			starting_price: 100,
			min_increment: 10,
			auction_start_at: '2026-05-01T00:00:00.000Z',
			auction_end_at: '2026-06-01T00:00:00.000Z',
			anti_snipe_minutes: 5,
		})
		expect(parsed.success).toBe(true)
	})

	it('rejects when end is before start', () => {
		const parsed = createAuctionConfigBodySchema.safeParse({
			starting_price: 100,
			min_increment: 10,
			auction_start_at: '2026-06-01T00:00:00.000Z',
			auction_end_at: '2026-05-01T00:00:00.000Z',
			anti_snipe_minutes: 5,
		})
		expect(parsed.success).toBe(false)
	})
})

describe('patchAuctionConfigBodySchema', () => {
	it('allows partial fields', () => {
		const parsed = patchAuctionConfigBodySchema.safeParse({ min_increment: 50 })
		expect(parsed.success).toBe(true)
	})
})

describe('placeBidBodySchema', () => {
	it('requires positive amount', () => {
		expect(placeBidBodySchema.safeParse({ amount: 0 }).success).toBe(false)
		expect(placeBidBodySchema.safeParse({ amount: 100 }).success).toBe(true)
	})
})
