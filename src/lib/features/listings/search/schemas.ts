// ============================================================================
// Listings — search query schemas
// ============================================================================

import { z } from 'zod'

export const listingsSearchQuerySchema = z
	.object({
		q: z.string().max(80).optional(),
		platform: z.enum(['mobile', 'automotive']).optional(),
		category_id: z.string().uuid().optional(),
		model_id: z.string().uuid().optional(),
		city: z.string().max(120).optional(),
		price_min: z.coerce.number().positive().optional(),
		price_max: z.coerce.number().positive().optional(),
		page: z.coerce.number().int().min(1).max(100).optional(),
		limit: z.coerce.number().int().min(1).max(50).optional(),
	})
	.strict()

export type ListingsSearchQuery = z.infer<typeof listingsSearchQuerySchema>
