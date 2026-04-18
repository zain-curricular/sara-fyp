// ============================================================================
// Auctions — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

export const createAuctionConfigBodySchema = z
	.object({
		starting_price: z.number().positive(),
		min_increment: z.number().positive(),
		auction_start_at: z.string().datetime({ offset: true }),
		auction_end_at: z.string().datetime({ offset: true }),
		anti_snipe_minutes: z.number().int().min(1).max(30),
	})
	.strict()
	.refine((d) => new Date(d.auction_end_at) > new Date(d.auction_start_at), {
		message: 'auction_end_at must be after auction_start_at',
	})

export type CreateAuctionConfigBody = z.infer<typeof createAuctionConfigBodySchema>

export const patchAuctionConfigBodySchema = z
	.object({
		starting_price: z.number().positive().optional(),
		min_increment: z.number().positive().optional(),
		auction_start_at: z.string().datetime({ offset: true }).optional(),
		auction_end_at: z.string().datetime({ offset: true }).optional(),
		anti_snipe_minutes: z.number().int().min(1).max(30).optional(),
	})
	.strict()
	.refine(
		(d) => {
			if (d.auction_start_at !== undefined && d.auction_end_at !== undefined) {
				return new Date(d.auction_end_at) > new Date(d.auction_start_at)
			}
			return true
		},
		{ message: 'auction_end_at must be after auction_start_at' },
	)

export type PatchAuctionConfigBody = z.infer<typeof patchAuctionConfigBodySchema>

export const placeBidBodySchema = z
	.object({
		amount: z.number().positive(),
	})
	.strict()

export type PlaceBidBody = z.infer<typeof placeBidBodySchema>

export const upsertAutoBidBodySchema = z
	.object({
		max_amount: z.number().positive(),
	})
	.strict()

export type UpsertAutoBidBody = z.infer<typeof upsertAutoBidBodySchema>
