import "server-only";

import { apiFetch, ApiError } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { fetchPublicProfile } from "@/lib/features/profiles/fetch-public-profile";
import type { PublicProfile } from "@/lib/features/profiles/types";

import { profileReviewsQuery } from "@/lib/features/reviews/query";
import { mapApiErrorToOrderDetailReviewResult } from "@/lib/features/reviews/_utils/map-order-detail-api-error";
import type {
	FetchOrderDetailForReviewResult,
	OrderDetailForReview,
	ReviewsListPayload,
} from "@/lib/features/reviews/types";

type OrderDetailResponse =
	| { ok: true; data: OrderDetailForReview }
	| { ok: false; error?: string };

type ProfileReviewsResponse =
	| { ok: true; data: ReviewsListPayload["items"]; pagination: ReviewsListPayload["pagination"] }
	| { ok: false; error?: string };

/**
 * Authenticated GET /api/orders/[id] for RSC.
 * - `no_session` — missing user/session or API 401
 * - `not_found` / `forbidden` — API 404 / 403 (caller may map both to `notFound()`)
 * - other failures — throws for `error.tsx`
 */
export async function fetchOrderDetailForReview(orderId: string): Promise<FetchOrderDetailForReviewResult> {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) {
		return { ok: false, reason: "no_session" };
	}

	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return { ok: false, reason: "no_session" };
	}

	try {
		const body = await apiFetch<OrderDetailResponse>(`/api/orders/${encodeURIComponent(orderId)}`, {
			accessToken: session.access_token,
		});
		if (!body.ok || !("data" in body)) {
			throw new Error("Unexpected order detail response");
		}
		return { ok: true, data: body.data };
	} catch (e) {
		if (e instanceof ApiError) {
			const mapped = mapApiErrorToOrderDetailReviewResult(e);
			if (mapped !== "rethrow") return mapped;
		}
		throw e;
	}
}

/** Public GET /api/profiles/[id]/reviews (paginated). */
export async function fetchProfileReviewsPage(
	profileId: string,
	page = 1,
	limit = 20,
): Promise<ReviewsListPayload> {
	const qs = profileReviewsQuery(page, limit);
	const body = await apiFetch<ProfileReviewsResponse>(
		`/api/profiles/${encodeURIComponent(profileId)}/reviews${qs}`,
	);
	if (!body.ok || !("data" in body)) {
		throw new Error("Failed to load reviews");
	}
	return {
		items: body.data,
		pagination: body.pagination,
	};
}

/** Single RSC entry for `/sellers/[id]`: public profile + first page of reviews (reviews fetch throws on failure). */
export async function fetchSellerPublicPagePayload(profileId: string): Promise<{
	profile: PublicProfile;
	reviewsInitial: ReviewsListPayload;
} | null> {
	const profile = await fetchPublicProfile(profileId);
	if (!profile) {
		return null;
	}

	const reviewsInitial = await fetchProfileReviewsPage(profileId, 1, 20);
	return { profile, reviewsInitial };
}
