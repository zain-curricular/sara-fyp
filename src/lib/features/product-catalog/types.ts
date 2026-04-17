// ============================================================================
// Product catalog — domain types
// ============================================================================
//
// Re-exports Row aliases from database.types for the catalog feature module.

import type {
	BrandRow as DBBrand,
	CategoryRow as DBCategory,
	ModelRow as DBModel,
	PlatformType as DBPlatform,
	SpecificationRow as DBSpec,
} from '@/lib/supabase/database.types'

export type PlatformType = DBPlatform
export type CategoryRow = DBCategory
export type BrandRow = DBBrand
export type ModelRow = DBModel
export type SpecificationRow = DBSpec
