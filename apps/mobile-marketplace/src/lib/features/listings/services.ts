import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
	SEARCH_LIMIT_DEFAULT,
	SEARCH_LIMIT_MAX,
	SEARCH_PAGE_MAX,
	SEARCH_Q_MAX,
	SEARCH_Q_TSVECTOR_MIN,
} from "@/lib/features/listings/config";
import type {
	CategoryOption,
	ListingImageRecord,
	ListingRecord,
	ListingsPagination,
} from "@/lib/features/listings/types";
import type { ListingsSearchParams } from "@/lib/features/listings/schemas";

function escapeIlike(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type SearchListingsResult = {
	data: ListingRecord[] | null;
	pagination: ListingsPagination;
	error: unknown;
};

/**
 * Public listing search (`status = active`, not soft-deleted). Uses SSR Supabase client (RLS).
 */
export async function searchListingsPublic(
	params: ListingsSearchParams,
): Promise<SearchListingsResult> {
	const supabase = await createServerSupabaseClient();

	const page = Math.min(Math.max(params.page ?? 1, 1), SEARCH_PAGE_MAX);
	const limit = Math.min(Math.max(params.limit ?? SEARCH_LIMIT_DEFAULT, 1), SEARCH_LIMIT_MAX);
	const offset = (page - 1) * limit;
	const to = offset + limit - 1;

	let q = supabase
		.from("listings")
		.select("*", { count: "exact" })
		.eq("status", "active")
		.is("deleted_at", null);

	const platform = params.platform ?? "mobile";
	q = q.eq("platform", platform);

	if (params.category_id) {
		q = q.eq("category_id", params.category_id);
	}
	if (params.model_id) {
		q = q.eq("model_id", params.model_id);
	}
	if (params.city) {
		q = q.ilike("city", `%${escapeIlike(params.city.trim())}%`);
	}
	if (params.price_min !== undefined) {
		q = q.gte("price", params.price_min);
	}
	if (params.price_max !== undefined) {
		q = q.lte("price", params.price_max);
	}

	const rawQ = params.q?.trim().slice(0, SEARCH_Q_MAX) ?? "";
	if (rawQ.length >= SEARCH_Q_TSVECTOR_MIN) {
		q = q.textSearch("search_vector", rawQ, { type: "websearch", config: "english" });
	} else if (rawQ.length > 0) {
		const pat = `%${escapeIlike(rawQ)}%`;
		q = q.ilike("title", pat);
	}

	const { data, error, count } = await q.order("created_at", { ascending: false }).range(offset, to);

	const total = count ?? 0;
	return {
		data: (data as ListingRecord[] | null) ?? null,
		pagination: { total, limit, offset, hasMore: total > offset + limit },
		error,
	};
}

export async function listListingImages(
	listingId: string,
): Promise<{ data: ListingImageRecord[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("listing_images")
		.select("id, listing_id, storage_path, url, position")
		.eq("listing_id", listingId)
		.order("position", { ascending: true });

	return { data: (data as ListingImageRecord[] | null) ?? null, error };
}

/**
 * Detail view: active listings are public; owners see their listing in any non-deleted state.
 */
export async function getListingForViewer(
	listingId: string,
	viewerUserId: string | null,
): Promise<{ data: ListingRecord | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase.from("listings").select("*").eq("id", listingId).maybeSingle();

	if (error) {
		return { data: null, error };
	}
	const row = data as ListingRecord | null;
	if (!row) {
		return { data: null, error: null };
	}
	if (row.deleted_at) {
		if (!viewerUserId || row.user_id !== viewerUserId) {
			return { data: null, error: null };
		}
	}
	if (row.status !== "active" && (!viewerUserId || row.user_id !== viewerUserId)) {
		return { data: null, error: null };
	}
	return { data: row, error: null };
}

export type ListingDetailForViewerPayload = {
	listing: ListingRecord;
	images: ListingImageRecord[];
};

/** Single server call for the listing detail page: row + ordered images. */
export async function getListingDetailForViewer(
	listingId: string,
	viewerUserId: string | null,
): Promise<{ data: ListingDetailForViewerPayload | null; error: unknown }> {
	const { data: listing, error } = await getListingForViewer(listingId, viewerUserId);
	if (error) {
		return { data: null, error };
	}
	if (!listing) {
		return { data: null, error: null };
	}

	const { data: images, error: imagesError } = await listListingImages(listingId);
	if (imagesError) {
		return { data: null, error: imagesError };
	}

	return { data: { listing, images: images ?? [] }, error: null };
}

/** Seller dashboard: non-deleted listings for the signed-in user. */
export async function listSellerListings(
	userId: string,
): Promise<{ data: ListingRecord[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("listings")
		.select("*")
		.eq("user_id", userId)
		.is("deleted_at", null)
		.order("updated_at", { ascending: false })
		.limit(100);

	return { data: (data as ListingRecord[] | null) ?? null, error };
}

/** Owner-only fetch for edit screen. */
export async function getListingForOwner(
	listingId: string,
	ownerId: string,
): Promise<{ data: ListingRecord | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase.from("listings").select("*").eq("id", listingId).maybeSingle();

	if (error) {
		return { data: null, error };
	}
	const row = data as ListingRecord | null;
	if (!row || row.deleted_at || row.user_id !== ownerId) {
		return { data: null, error: null };
	}
	return { data: row, error: null };
}

export async function listMobileCategories(): Promise<{ data: CategoryOption[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("categories")
		.select("id, name, slug")
		.eq("platform", "mobile")
		.eq("is_active", true)
		.order("name", { ascending: true });

	return { data: (data as CategoryOption[] | null) ?? null, error };
}
