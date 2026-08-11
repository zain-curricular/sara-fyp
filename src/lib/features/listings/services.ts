import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchProfileReviewsPage } from "@/lib/features/reviews/services";
import type { ReviewsListPayload } from "@/lib/features/reviews/types";

import {
	IMAGE_BUCKET,
	IMAGE_MAX_PER_LISTING,
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

/** Public listing search (`status = active`, not soft-deleted). Uses SSR Supabase client (RLS). */
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
		.select("*, listing_images(url, position)", { count: "exact" })
		.eq("status", "active")
		.is("deleted_at", null);

	const platform = params.platform ?? "automotive";
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

	if (params.condition) {
		q = q.eq("condition", params.condition);
	}
	if (params.sale_type === "fixed") {
		q = q.or("sale_type.eq.fixed,sale_type.eq.both");
	} else if (params.sale_type === "auction") {
		q = q.or("sale_type.eq.auction,sale_type.eq.both");
	}

	const sort = params.sort ?? "newest";
	if (sort === "price_asc") {
		q = q.order("price", { ascending: true });
	} else if (sort === "price_desc") {
		q = q.order("price", { ascending: false });
	} else {
		q = q.order("created_at", { ascending: false });
	}

	const { data, error, count } = await q.range(offset, to);

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

/** Failure modes the image upload can report back to the HTTP layer. */
export type AddListingImageReason = "not_found" | "limit_reached" | "storage" | "database";

export type AddListingImageResult =
	| { data: ListingImageRecord; error: null; reason: null }
	| { data: null; error: unknown; reason: AddListingImageReason };

/**
 * Upload one photo for a listing and record it in `listing_images`.
 *
 * Ownership is enforced twice — once here (so a non-owner gets a clean 404
 * instead of an RLS error) and again by the storage/table policies, since the
 * request runs under the caller's session rather than the service role.
 *
 * Objects are stored at `{ownerId}/{listingId}/{uuid}.{ext}` because the
 * `listing-images` bucket policy keys writes on the first path segment being
 * `auth.uid()`. Position is appended after the current highest.
 */
export async function addListingImage(
	listingId: string,
	ownerId: string,
	file: File,
): Promise<AddListingImageResult> {
	const supabase = await createServerSupabaseClient();

	//.. Ownership gate — deleted or someone else's listing reads as "not found".
	const { data: listing, error: listingError } = await getListingForOwner(listingId, ownerId);
	if (listingError) {
		return { data: null, error: listingError, reason: "database" };
	}
	if (!listing) {
		return { data: null, error: null, reason: "not_found" };
	}

	//.. Existing photos decide both the cap and the next position slot.
	const { data: existing, error: existingError } = await listListingImages(listingId);
	if (existingError) {
		return { data: null, error: existingError, reason: "database" };
	}

	const images = existing ?? [];
	if (images.length >= IMAGE_MAX_PER_LISTING) {
		return { data: null, error: null, reason: "limit_reached" };
	}

	//.. Take the lowest free slot, not max+1 — deletions must not strand the
	//.. listing below the cap with every remaining position near the ceiling.
	const taken = new Set(images.map((img) => img.position));
	let position = 0;
	while (taken.has(position)) position += 1;

	const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice("image/".length);
	const storagePath = `${ownerId}/${listingId}/${crypto.randomUUID()}.${extension}`;

	const { error: uploadError } = await supabase.storage
		.from(IMAGE_BUCKET)
		.upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false });

	if (uploadError) {
		return { data: null, error: uploadError, reason: "storage" };
	}

	const { data: publicUrl } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);

	const { data: inserted, error: insertError } = await supabase
		.from("listing_images")
		.insert({ listing_id: listingId, storage_path: storagePath, url: publicUrl.publicUrl, position })
		.select("id, listing_id, storage_path, url, position")
		.single();

	//.. Roll the object back so a failed insert cannot leave an orphan in storage.
	if (insertError) {
		await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
		return { data: null, error: insertError, reason: "database" };
	}

	return { data: inserted as ListingImageRecord, error: null, reason: null };
}

/** Detail view: active listings are public; owners see their listing in any non-deleted state. */
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

export type ListingDetailPagePayload = ListingDetailForViewerPayload & {
	sellerReviews: ReviewsListPayload;
};

/**
 * Listing detail RSC: listing + images + seller reviews (first page).
 */
export async function getListingDetailPagePayload(
	listingId: string,
	viewerUserId: string | null,
): Promise<{ data: ListingDetailPagePayload | null; error: unknown }> {
	const { data: detail, error } = await getListingDetailForViewer(listingId, viewerUserId);
	if (error) {
		return { data: null, error };
	}
	if (!detail) {
		return { data: null, error: null };
	}

	const sellerReviews = await fetchProfileReviewsPage(detail.listing.user_id, 1, 5);
	return { data: { ...detail, sellerReviews }, error: null };
}

export async function listAutomotiveCategories(): Promise<{ data: CategoryOption[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("categories")
		.select("id, name, slug")
		.eq("platform", "automotive")
		.eq("is_active", true)
		.order("name", { ascending: true });

	return { data: (data as CategoryOption[] | null) ?? null, error };
}
