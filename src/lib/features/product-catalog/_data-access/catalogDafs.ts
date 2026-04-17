// ============================================================================
// Product catalog — data access (single file per convention)
// ============================================================================
//
// All catalog DAFs use the typed service-role Supabase client. Return
// `{ data, error }` (or `PaginatedResult`); never throw. Admin writes bypass
// RLS via service role — routes must call the admin auth wrapper first.
//
// Tables
// ------
// categories, brands, models, specifications — see 20260416000002_product_catalog.sql

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import {
	CATALOG_LIST_MAX,
	CATALOG_SEARCH_MODELS_LIMIT,
	CATALOG_SEARCH_Q_MAX,
} from '@/lib/features/product-catalog/config'
import type {
	BrandRow,
	CategoryRow,
	Database,
	ModelRow,
	PlatformType,
	SpecificationRow,
} from '@/lib/supabase/database.types'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']
type BrandInsert = Database['public']['Tables']['brands']['Insert']
type BrandUpdate = Database['public']['Tables']['brands']['Update']
type ModelInsert = Database['public']['Tables']['models']['Insert']
type ModelUpdate = Database['public']['Tables']['models']['Update']
type SpecInsert = Database['public']['Tables']['specifications']['Insert']
type SpecUpdate = Database['public']['Tables']['specifications']['Update']

function escapeIlike(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

// -------------------------------------------------------
// Categories
// -------------------------------------------------------

/**
 * Lists all categories for a platform (admin path may include inactive rows).
 *
 * @param platform - mobile | automotive
 */
export async function listCategoriesByPlatform(
	platform: PlatformType,
): Promise<{ data: CategoryRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('categories')
		.select('*')
		.eq('platform', platform)
		.order('position', { ascending: true })
		.order('name', { ascending: true })
		.limit(CATALOG_LIST_MAX)

	if (error) {
		logDatabaseError('catalog:listCategoriesByPlatform', { platform }, error)
	}
	return { data, error }
}

/**
 * Loads a single category by id.
 *
 * @param id - Category UUID.
 */
export async function getCategoryById(
	id: string,
): Promise<{ data: CategoryRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('categories').select('*').eq('id', id).maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:getCategoryById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Creates a category row (admin).
 */
export async function createCategory(
	row: CategoryInsert,
): Promise<{ data: CategoryRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('categories').insert(row).select('*').maybeSingle()
	if (error) {
		logDatabaseError('catalog:createCategory', {}, error)
	}
	return { data, error }
}

/**
 * Updates a category row (admin).
 */
export async function updateCategoryById(
	id: string,
	patch: CategoryUpdate,
): Promise<{ data: CategoryRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('categories')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:updateCategoryById', { id }, error)
	}
	return { data, error }
}

/**
 * Deletes a category (admin); cascades to children per FK.
 */
export async function deleteCategoryById(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('categories').delete().eq('id', id)
	if (error) {
		logDatabaseError('catalog:deleteCategoryById', { id }, error)
	}
	return { error }
}

// -------------------------------------------------------
// Brands
// -------------------------------------------------------

/**
 * Lists brands for a platform.
 */
export async function listBrandsByPlatform(
	platform: PlatformType,
): Promise<{ data: BrandRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('brands')
		.select('*')
		.eq('platform', platform)
		.order('name', { ascending: true })
		.limit(CATALOG_LIST_MAX)

	if (error) {
		logDatabaseError('catalog:listBrandsByPlatform', { platform }, error)
	}
	return { data, error }
}

/**
 * Loads a brand by id.
 */
export async function getBrandById(id: string): Promise<{ data: BrandRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('brands').select('*').eq('id', id).maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:getBrandById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function createBrand(
	row: BrandInsert,
): Promise<{ data: BrandRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('brands').insert(row).select('*').maybeSingle()
	if (error) {
		logDatabaseError('catalog:createBrand', {}, error)
	}
	return { data, error }
}

export async function updateBrandById(
	id: string,
	patch: BrandUpdate,
): Promise<{ data: BrandRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('brands')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:updateBrandById', { id }, error)
	}
	return { data, error }
}

export async function deleteBrandById(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('brands').delete().eq('id', id)
	if (error) {
		logDatabaseError('catalog:deleteBrandById', { id }, error)
	}
	return { error }
}

// -------------------------------------------------------
// Models
// -------------------------------------------------------

/**
 * Searches models by name (trigram-friendly ilike). Optional filters.
 *
 * @param q - Search string (length-checked by caller).
 * @param options - Optional platform + brand filter.
 */
export async function searchModelsByName(
	q: string,
	options: { platform?: PlatformType; brandId?: string } = {},
): Promise<{ data: ModelRow[] | null; error: unknown }> {
	const term = escapeIlike(q.trim())
	const pattern = `%${term}%`

	let brandIds: string[] | null = null
	if (options.platform) {
		const { data: brandRows, error: bErr } = await getAdmin()
			.from('brands')
			.select('id')
			.eq('platform', options.platform)
		if (bErr) {
			logDatabaseError('catalog:searchModelsByName:brands', { platform: options.platform }, bErr)
			return { data: null, error: bErr }
		}
		brandIds = (brandRows ?? []).map((b) => b.id)
		if (brandIds.length === 0) {
			return { data: [], error: null }
		}
	}

	let query = getAdmin().from('models').select('*').ilike('name', pattern).eq('is_active', true)

	if (options.brandId) {
		query = query.eq('brand_id', options.brandId)
	} else if (brandIds) {
		query = query.in('brand_id', brandIds)
	}

	const { data, error } = await query.order('name', { ascending: true }).limit(CATALOG_SEARCH_MODELS_LIMIT)

	if (error) {
		logDatabaseError('catalog:searchModelsByName', { q: q.slice(0, CATALOG_SEARCH_Q_MAX) }, error)
	}
	return { data, error }
}

/**
 * Lists all models whose brand belongs to the given platform (admin; includes inactive).
 *
 * @param platform - mobile | automotive
 */
export async function listModelsByPlatform(
	platform: PlatformType,
): Promise<{ data: ModelRow[] | null; error: unknown }> {
	const { data: brandRows, error: bErr } = await getAdmin()
		.from('brands')
		.select('id')
		.eq('platform', platform)

	if (bErr) {
		logDatabaseError('catalog:listModelsByPlatform:brands', { platform }, bErr)
		return { data: null, error: bErr }
	}

	const brandIds = (brandRows ?? []).map((b) => b.id)
	if (brandIds.length === 0) {
		return { data: [], error: null }
	}

	const { data, error } = await getAdmin()
		.from('models')
		.select('*')
		.in('brand_id', brandIds)
		.order('name', { ascending: true })
		.limit(CATALOG_LIST_MAX)

	if (error) {
		logDatabaseError('catalog:listModelsByPlatform', { platform }, error)
	}
	return { data, error }
}

/**
 * Loads a model by id (no is_active filter — caller applies for public paths).
 */
export async function getModelById(id: string): Promise<{ data: ModelRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('models').select('*').eq('id', id).maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:getModelById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function createModel(
	row: ModelInsert,
): Promise<{ data: ModelRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('models').insert(row).select('*').maybeSingle()
	if (error) {
		logDatabaseError('catalog:createModel', {}, error)
	}
	return { data, error }
}

export async function updateModelById(
	id: string,
	patch: ModelUpdate,
): Promise<{ data: ModelRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('models')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:updateModelById', { id }, error)
	}
	return { data, error }
}

export async function deleteModelById(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('models').delete().eq('id', id)
	if (error) {
		logDatabaseError('catalog:deleteModelById', { id }, error)
	}
	return { error }
}

// -------------------------------------------------------
// Specifications
// -------------------------------------------------------

/**
 * Loads specification row for a model (1:1).
 */
export async function getSpecificationByModelId(
	modelId: string,
): Promise<{ data: SpecificationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('specifications')
		.select('*')
		.eq('model_id', modelId)
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:getSpecificationByModelId', { modelId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function getSpecificationById(
	id: string,
): Promise<{ data: SpecificationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('specifications')
		.select('*')
		.eq('id', id)
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:getSpecificationById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function createSpecification(
	row: SpecInsert,
): Promise<{ data: SpecificationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('specifications')
		.insert(row)
		.select('*')
		.maybeSingle()
	if (error) {
		logDatabaseError('catalog:createSpecification', {}, error)
	}
	return { data, error }
}

export async function updateSpecificationById(
	id: string,
	patch: SpecUpdate,
): Promise<{ data: SpecificationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('specifications')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('catalog:updateSpecificationById', { id }, error)
	}
	return { data, error }
}

export async function deleteSpecificationById(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('specifications').delete().eq('id', id)
	if (error) {
		logDatabaseError('catalog:deleteSpecificationById', { id }, error)
	}
	return { error }
}
