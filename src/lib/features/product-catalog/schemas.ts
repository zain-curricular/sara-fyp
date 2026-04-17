// ============================================================================
// Product catalog — Zod schemas (admin bodies + query helpers)
// ============================================================================
//
// Strict schemas for POST/PATCH bodies on /api/admin/catalog/*. JSONB fields
// use open object maps; listings feature validates listing.details against
// category.spec_schema at submit time.

import { z } from 'zod'

const platformSchema = z.enum(['mobile', 'automotive'])

const jsonbRecord = z.record(z.string(), z.unknown())

/**
 * Query params for GET /api/catalog/categories and /brands.
 */
export const catalogPlatformQuerySchema = z.object({
	platform: platformSchema,
})

/**
 * Query params for GET /api/catalog/models (search).
 */
export const catalogModelsSearchQuerySchema = z
	.object({
		q: z.string().min(2).max(80),
		platform: platformSchema.optional(),
		brand_id: z.string().uuid().optional(),
	})
	.strict()

export const createCategorySchema = z
	.object({
		platform: platformSchema,
		name: z.string().min(1).max(200),
		slug: z.string().min(1).max(200),
		parent_id: z.string().uuid().nullable().optional(),
		icon_url: z.string().url().nullable().optional(),
		position: z.number().int().min(0).max(32767).optional(),
		is_active: z.boolean().optional(),
		spec_schema: jsonbRecord.optional(),
	})
	.strict()

export const updateCategorySchema = createCategorySchema.partial().strict()

export const createBrandSchema = z
	.object({
		platform: platformSchema,
		name: z.string().min(1).max(200),
		slug: z.string().min(1).max(200),
		logo_url: z.string().url().nullable().optional(),
	})
	.strict()

export const updateBrandSchema = createBrandSchema.partial().strict()

export const createModelSchema = z
	.object({
		brand_id: z.string().uuid(),
		category_id: z.string().uuid(),
		name: z.string().min(1).max(300),
		slug: z.string().min(1).max(300),
		year: z.number().int().min(1900).max(2100).nullable().optional(),
		image_url: z.string().url().nullable().optional(),
		is_active: z.boolean().optional(),
	})
	.strict()

export const updateModelSchema = createModelSchema.partial().strict()

export const createSpecificationSchema = z
	.object({
		model_id: z.string().uuid(),
		specs: jsonbRecord,
	})
	.strict()

export const updateSpecificationSchema = z
	.object({
		specs: jsonbRecord,
	})
	.strict()

/**
 * Query params for GET /api/admin/catalog/specifications (lookup by model).
 */
export const adminSpecificationByModelQuerySchema = z
	.object({
		model_id: z.string().uuid(),
	})
	.strict()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
export type CreateModelInput = z.infer<typeof createModelSchema>
export type UpdateModelInput = z.infer<typeof updateModelSchema>
export type CreateSpecificationInput = z.infer<typeof createSpecificationSchema>
export type UpdateSpecificationInput = z.infer<typeof updateSpecificationSchema>
