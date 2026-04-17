// ============================================================================
// Product catalog — public read orchestration
// ============================================================================
//
// Applies is_active and related business rules for unauthenticated catalog
// reads. DAFs return raw rows; these helpers shape what the marketplace exposes.

import type {
	BrandRow,
	CategoryRow,
	ModelRow,
	PlatformType,
	SpecificationRow,
} from '@/lib/features/product-catalog/types'
import {
	getCategoryById,
	getModelById,
	getSpecificationByModelId,
	listBrandsByPlatform,
	listCategoriesByPlatform,
	searchModelsByName,
} from '../_data-access/catalogDafs'

/**
 * Lists active categories for a platform (flat list — client may build a tree).
 *
 * @param platform - mobile | automotive
 */
export async function listCategoriesPublic(
	platform: PlatformType,
): Promise<{ data: CategoryRow[] | null; error: unknown }> {
	const { data, error } = await listCategoriesByPlatform(platform)
	if (error || !data) {
		return { data: null, error }
	}

	const active = data.filter((c) => c.is_active)
	return { data: active, error: null }
}

/**
 * Returns spec_schema JSON for an active category (for listing form rendering).
 *
 * @param id - Category id
 */
export async function getCategorySpecSchemaPublic(
	id: string,
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
	const { data, error } = await getCategoryById(id)
	if (error) {
		return { data: null, error }
	}
	if (!data || !data.is_active) {
		return { data: null, error: null }
	}

	return { data: data.spec_schema as Record<string, unknown>, error: null }
}

/**
 * Lists brands for a platform (brands table has no is_active — all rows).
 *
 * @param platform - mobile | automotive
 */
export async function listBrandsPublic(
	platform: PlatformType,
): Promise<{ data: BrandRow[] | null; error: unknown }> {
	return listBrandsByPlatform(platform)
}

/**
 * Searches active models; delegates to DAF with optional platform/brand filters.
 *
 * @param q - Search substring
 * @param options - Optional platform or brand scoping
 */
export async function searchModelsPublic(
	q: string,
	options: { platform?: PlatformType; brandId?: string } = {},
): Promise<{ data: ModelRow[] | null; error: unknown }> {
	return searchModelsByName(q, options)
}

/**
 * Returns a single active model by id (inactive models hidden from public API).
 *
 * @param id - Model id
 */
export async function getModelPublic(
	id: string,
): Promise<{ data: ModelRow | null; error: unknown }> {
	const { data, error } = await getModelById(id)
	if (error) {
		return { data: null, error }
	}
	if (!data || !data.is_active) {
		return { data: null, error: null }
	}
	return { data, error: null }
}

/**
 * Returns specification JSON for a model if the model is active.
 *
 * @param modelId - Model id (1:1 with specifications.model_id)
 */
export async function getSpecificationByModelPublic(
	modelId: string,
): Promise<{ data: SpecificationRow | null; error: unknown }> {
	const { data: model, error: mErr } = await getModelById(modelId)
	if (mErr) {
		return { data: null, error: mErr }
	}
	if (!model || !model.is_active) {
		return { data: null, error: null }
	}

	const { data, error } = await getSpecificationByModelId(modelId)
	if (error) {
		return { data: null, error }
	}
	return { data, error: null }
}
