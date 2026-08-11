import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
	Brand,
	BrandWithListingCount,
	CatalogVariant,
	ListingSummary,
	Model,
	Specification,
} from "@/lib/features/product-catalog/types";
import { extractVariantsFromSpecs } from "@/lib/features/product-catalog/utils";

export async function listBrandsByPlatform(
	platform: "mobile" | "automotive",
): Promise<{ data: Brand[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("brands")
		.select("*")
		.eq("platform", platform)
		.order("name", { ascending: true });

	return { data: (data as Brand[] | null) ?? null, error };
}

/** Shape PostgREST returns for the nested brands → models → listings count embed. */
type BrandCountRow = {
	name: string;
	slug: string;
	models: { listings: { count: number }[] }[] | null;
};

/**
 * Brands ranked by how many active listings sit under them, for catalog entry
 * points that need real inventory numbers.
 *
 * Counts are aggregated by PostgREST across the brand → model → listing chain,
 * so this stays one round trip. Brands with no live inventory are dropped —
 * a chip advertising zero parts is worse than no chip.
 */
export async function listBrandsWithListingCounts(
	platform: "mobile" | "automotive",
): Promise<{ data: BrandWithListingCount[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("brands")
		.select("name, slug, models(listings(count))")
		.eq("platform", platform)
		.eq("models.listings.status", "active")
		.is("models.listings.deleted_at", null);

	if (error) return { data: null, error };

	// Flatten the per-model counts into one total per brand, then rank.
	const ranked = ((data ?? []) as BrandCountRow[])
		.map((brand) => ({
			name: brand.name,
			slug: brand.slug,
			listingCount: (brand.models ?? []).reduce(
				(total, model) => total + (model.listings?.[0]?.count ?? 0),
				0,
			),
		}))
		.filter((brand) => brand.listingCount > 0)
		.sort((a, b) => b.listingCount - a.listingCount);

	return { data: ranked, error: null };
}

const LISTINGS_BY_MODEL_LIMIT = 50;

export async function getBrandById(id: string): Promise<{ data: Brand | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase.from("brands").select("*").eq("id", id).maybeSingle();

	return { data: (data as Brand | null) ?? null, error };
}

export async function getBrandBySlug(
	platform: "mobile" | "automotive",
	slug: string,
): Promise<{ data: Brand | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("brands")
		.select("*")
		.eq("platform", platform)
		.eq("slug", slug)
		.maybeSingle();

	return { data: (data as Brand | null) ?? null, error };
}

export async function listActiveModelsByBrandId(
	brandId: string,
): Promise<{ data: Model[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("models")
		.select("*")
		.eq("brand_id", brandId)
		.eq("is_active", true)
		.order("name", { ascending: true });

	return { data: (data as Model[] | null) ?? null, error };
}

export async function getActiveModelById(modelId: string): Promise<{ data: Model | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("models")
		.select("*")
		.eq("id", modelId)
		.eq("is_active", true)
		.maybeSingle();

	return { data: (data as Model | null) ?? null, error };
}

export async function getSpecificationByModelId(
	modelId: string,
): Promise<{ data: Specification | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("specifications")
		.select("*")
		.eq("model_id", modelId)
		.maybeSingle();

	return { data: (data as Specification | null) ?? null, error };
}

/** Active automotive listings for a model, newest first. */
export async function searchListingsByModelId(
	modelId: string,
): Promise<{ data: ListingSummary[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("listings")
		.select("id, title, price, city, condition")
		.eq("status", "active")
		.is("deleted_at", null)
		.eq("platform", "automotive")
		.eq("model_id", modelId)
		.order("created_at", { ascending: false })
		.limit(LISTINGS_BY_MODEL_LIMIT);

	return { data: (data as ListingSummary[] | null) ?? null, error };
}

export async function getModelVariants(
	modelId: string,
): Promise<{ data: CatalogVariant[] | null; error: unknown }> {
	const { data: model, error: modelError } = await getActiveModelById(modelId);
	if (modelError) return { data: null, error: modelError };
	if (!model) return { data: null, error: null };

	const { data: spec, error } = await getSpecificationByModelId(modelId);
	if (error) return { data: null, error };
	if (!spec) return { data: [], error: null };

	return { data: extractVariantsFromSpecs(spec.specs), error: null };
}
