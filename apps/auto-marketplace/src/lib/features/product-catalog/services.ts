import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
	Brand,
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
