// ============================================================================
// Favorites — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

export const toggleFavoriteBodySchema = z
	.object({
		listing_id: z.string().uuid(),
	})
	.strict()

export type ToggleFavoriteBody = z.infer<typeof toggleFavoriteBodySchema>

const paginationSchema = z
	.object({
		page: z.coerce.number().int().min(1).max(10_000).default(1),
		limit: z.coerce.number().int().min(1).max(50).default(20),
	})
	.strict()

export const favoritesListQuerySchema = paginationSchema

export const recentViewsQuerySchema = paginationSchema
