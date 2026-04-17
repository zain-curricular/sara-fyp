// ============================================================================
// Reviews — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

export const postReviewSchema = z
	.object({
		order_id: z.string().uuid(),
		rating: z.number().int().min(1).max(5),
		comment: z.string().max(1000).optional().nullable(),
	})
	.strict()

export type PostReviewInput = z.infer<typeof postReviewSchema>

export const reviewsListQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(20),
	offset: z.coerce.number().int().min(0).max(10_000).default(0),
})

export type ReviewsListQuery = z.infer<typeof reviewsListQuerySchema>
