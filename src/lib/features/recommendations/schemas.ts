// ============================================================================
// Recommendations — query validation (public GET params)
// ============================================================================

import { z } from 'zod'

import { RECOMMENDATIONS_MAX_LIMIT } from './config'

const limitField = z.coerce.number().int().min(1).max(RECOMMENDATIONS_MAX_LIMIT)

export const similarListingsQuerySchema = z.object({
	limit: limitField.default(12),
})

export const trendingQuerySchema = z.object({
	platform: z.enum(['mobile', 'automotive']),
	limit: limitField.default(20),
})

export const forMeQuerySchema = z.object({
	platform: z.enum(['mobile', 'automotive']).default('mobile'),
	limit: limitField.default(20),
})

export type SimilarListingsQuery = z.infer<typeof similarListingsQuerySchema>
export type TrendingQuery = z.infer<typeof trendingQuerySchema>
export type ForMeQuery = z.infer<typeof forMeQuerySchema>
