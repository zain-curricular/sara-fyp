// ============================================================================
// Product catalog — client-safe barrel
// ============================================================================
//
// Types and Zod schemas for forms and route validation. Server-only DAFs,
// auth, and public orchestrators live in `./services` (API routes and RSC).

export type {
	PlatformType,
	CategoryRow,
	BrandRow,
	ModelRow,
	SpecificationRow,
} from './types'

export {
	catalogPlatformQuerySchema,
	catalogModelsSearchQuerySchema,
	createCategorySchema,
	updateCategorySchema,
	createBrandSchema,
	updateBrandSchema,
	createModelSchema,
	updateModelSchema,
	createSpecificationSchema,
	updateSpecificationSchema,
	adminSpecificationByModelQuerySchema,
	type CreateCategoryInput,
	type UpdateCategoryInput,
	type CreateBrandInput,
	type UpdateBrandInput,
	type CreateModelInput,
	type UpdateModelInput,
	type CreateSpecificationInput,
	type UpdateSpecificationInput,
} from './schemas'
