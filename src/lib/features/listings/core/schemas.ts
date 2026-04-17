// ============================================================================
// Listings — core Zod schemas
// ============================================================================

import { z } from 'zod'

const platformSchema = z.enum(['mobile', 'automotive'])

const saleTypeSchema = z.enum(['fixed', 'auction', 'both'])

const conditionSchema = z.enum(['new', 'like_new', 'excellent', 'good', 'fair', 'poor'])

export const createListingSchema = z
	.object({
		platform: platformSchema,
		category_id: z.string().uuid(),
		model_id: z.string().uuid().nullable().optional(),
		title: z.string().min(1).max(200),
		description: z.string().max(20000).nullable().optional(),
		sale_type: saleTypeSchema,
		price: z.number().positive(),
		is_negotiable: z.boolean().optional(),
		condition: conditionSchema,
		details: z.record(z.string(), z.unknown()).default({}),
		city: z.string().min(1).max(120),
		area: z.string().max(120).nullable().optional(),
	})
	.strict()

export const updateListingSchema = createListingSchema.partial().strict()

export const adminModerateListingSchema = z
	.object({
		status: z.enum(['flagged', 'active', 'removed']),
	})
	.strict()

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
