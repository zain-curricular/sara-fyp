"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { useAuthenticatedFetch, useSessionApiFetch } from "@/lib/hooks/useAuthenticatedFetch";

import { profileReviewsQuery, profileReviewsNextPage } from "@/lib/features/reviews/query";
import type { PostReviewInput } from "@/lib/features/reviews/schemas";
import type { ReviewRecord } from "@/lib/features/reviews/types";
import type { ListingsPagination } from "@/lib/features/listings/types";

export type SubmitReviewResult =
	| { ok: true }
	| { ok: false; error: string; status?: number };

export type SellerReviewsBundle = {
	items: ReviewRecord[];
	pagination: ListingsPagination;
};

/**
 * POST /api/reviews (auth). Returns structured errors for toasts (4xx/5xx from API body when present).
 */
export function useSubmitReview() {
	const authFetch = useAuthenticatedFetch();

	return useCallback(
		async (input: PostReviewInput): Promise<SubmitReviewResult> => {
			try {
				await authFetch<{ ok: true; data: unknown }>(`/api/reviews`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				return { ok: true };
			} catch (e) {
				if (e instanceof ApiError) {
					let msg = "Failed to submit review";
					if (typeof e.body === "object" && e.body !== null && "error" in e.body) {
						const err = (e.body as { error?: string }).error;
						if (err) msg = err;
					}
					return { ok: false, error: msg, status: e.status };
				}
				return { ok: false, error: e instanceof Error ? e.message : "Failed to submit review" };
			}
		},
		[authFetch],
	);
}

/**
 * Client pagination for GET /api/profiles/[id]/reviews.
 * Remount the consumer (e.g. `key={sellerId}` on `ReviewsList`) when `initial` from RSC changes.
 */
export function useSellerReviews(sellerId: string, initial: SellerReviewsBundle) {
	const sessionFetch = useSessionApiFetch();
	const [items, setItems] = useState<ReviewRecord[]>(initial.items);
	const [pagination, setPagination] = useState<ListingsPagination>(initial.pagination);
	const [loading, setLoading] = useState(false);
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
	const loadingRef = useRef(false);

	const loadMore = useCallback(async () => {
		if (!pagination.hasMore || loadingRef.current || pagination.limit <= 0) return;
		const nextPage = profileReviewsNextPage(pagination.offset, pagination.limit);
		loadingRef.current = true;
		setLoading(true);
		setLoadMoreError(null);
		try {
			const qs = profileReviewsQuery(nextPage, pagination.limit);
			const res = await sessionFetch<
				| { ok: true; data: ReviewRecord[]; pagination: ListingsPagination }
				| { ok: false; error?: string }
			>(`/api/profiles/${encodeURIComponent(sellerId)}/reviews${qs}`);
			if (res.ok && "data" in res) {
				setItems((prev) => [...prev, ...res.data]);
				setPagination(res.pagination);
				return;
			}
			const msg =
				typeof res === "object" && res !== null && "error" in res && typeof res.error === "string" && res.error
					? res.error
					: "Could not load more reviews.";
			setLoadMoreError(msg);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Could not load more reviews.";
			setLoadMoreError(msg);
		} finally {
			loadingRef.current = false;
			setLoading(false);
		}
	}, [sellerId, sessionFetch, pagination.hasMore, pagination.limit, pagination.offset]);

	return useMemo(
		() => ({
			items,
			pagination,
			loading,
			loadMore,
			hasMore: pagination.hasMore,
			loadMoreError,
		}),
		[items, pagination, loading, loadMore, loadMoreError],
	);
}
