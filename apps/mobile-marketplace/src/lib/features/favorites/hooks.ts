"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSessionApiFetch } from "@/lib/hooks/useAuthenticatedFetch";

import { favoritesAndViewsQuery } from "@/lib/features/favorites/query";
import type { FavoriteListingRow, ViewedListingRow } from "@/lib/features/favorites/types";
import type { ListingsPagination } from "@/lib/features/listings/types";

type ToggleState = {
	isFavorited: boolean;
	isLoading: boolean;
	isPending: boolean;
	toggle: () => Promise<void>;
	isSignedIn: boolean;
};

/**
 * Wishlist toggle for a listing — loads favorited flag when signed in, POST /api/favorites to toggle.
 * When signed out, `toggle` sends the user to `/login`.
 */
export function useToggleFavorite(listingId: string): ToggleState {
	const sessionFetch = useSessionApiFetch();
	const router = useRouter();
	const [isSignedIn, setIsSignedIn] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const supabase = createBrowserSupabaseClient();

		async function run() {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (cancelled) return;

			if (!session?.access_token) {
				setIsSignedIn(false);
				setIsLoading(false);
				return;
			}

			setIsSignedIn(true);
			try {
				const res = await sessionFetch<
					{ ok: true; data: { is_favorited: boolean } } | { ok: false; error?: string }
				>(`/api/listings/${encodeURIComponent(listingId)}/is-favorited`);
				if (cancelled) return;
				if (res.ok && "data" in res) {
					setIsFavorited(res.data.is_favorited);
				}
			} catch {
				if (!cancelled) setIsFavorited(false);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [listingId, sessionFetch]);

	const toggle = useCallback(async () => {
		const supabase = createBrowserSupabaseClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.access_token) {
			router.push("/login");
			return;
		}

		setIsPending(true);
		try {
			const res = await sessionFetch<{ ok: true; data: { is_favorited: boolean } } | { ok: false }>(
				`/api/favorites`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ listing_id: listingId }),
				},
			);
			if (res.ok && "data" in res) {
				setIsFavorited(res.data.is_favorited);
				router.refresh();
			}
		} finally {
			setIsPending(false);
		}
	}, [listingId, router, sessionFetch]);

	return useMemo(
		() => ({ isFavorited, isLoading, isPending, toggle, isSignedIn }),
		[isFavorited, isLoading, isPending, toggle, isSignedIn],
	);
}

type ListLoadable<T> = {
	data: T | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
};

/**
 * Client GET /api/favorites/me (paginated).
 * Buyer `/buyer/favorites` should use RSC `fetchMyFavorites` + shell props; this hook is for client-only surfaces.
 */
export function useFavorites(page = 1, limit = 24): ListLoadable<{
	items: FavoriteListingRow[];
	pagination: ListingsPagination;
}> {
	const sessionFetch = useSessionApiFetch();
	const [data, setData] = useState<{ items: FavoriteListingRow[]; pagination: ListingsPagination } | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => setNonce((n) => n + 1), []);

	useEffect(() => {
		let cancelled = false;
		const supabase = createBrowserSupabaseClient();

		async function run() {
			setIsLoading(true);
			setError(null);
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session?.access_token) {
				if (!cancelled) {
					setData(null);
					setIsLoading(false);
					setError("Sign in required");
				}
				return;
			}

			try {
				const qs = favoritesAndViewsQuery(page, limit);
				const res = await sessionFetch<
					| {
							ok: true;
							data: FavoriteListingRow[];
							pagination: ListingsPagination;
					  }
					| { ok: false; error?: string }
				>(`/api/favorites/me${qs}`);
				if (cancelled) return;
				if (res.ok && "data" in res) {
					setData({ items: res.data, pagination: res.pagination });
					return;
				}
				setError("Failed to load favorites");
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load favorites");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [page, limit, nonce, sessionFetch]);

	return useMemo(
		() => ({ data, isLoading, error, refetch }),
		[data, isLoading, error, refetch],
	);
}

/**
 * Client GET /api/me/recent-views (paginated).
 * Buyer `/buyer/viewed` should use RSC `fetchMyViewedListings` + shell props; this hook is for client-only surfaces.
 */
export function useViewedHistory(page = 1, limit = 24): ListLoadable<{
	items: ViewedListingRow[];
	pagination: ListingsPagination;
}> {
	const sessionFetch = useSessionApiFetch();
	const [data, setData] = useState<{ items: ViewedListingRow[]; pagination: ListingsPagination } | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => setNonce((n) => n + 1), []);

	useEffect(() => {
		let cancelled = false;
		const supabase = createBrowserSupabaseClient();

		async function run() {
			setIsLoading(true);
			setError(null);
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session?.access_token) {
				if (!cancelled) {
					setData(null);
					setIsLoading(false);
					setError("Sign in required");
				}
				return;
			}

			try {
				const qs = favoritesAndViewsQuery(page, limit);
				const res = await sessionFetch<
					| {
							ok: true;
							data: ViewedListingRow[];
							pagination: ListingsPagination;
					  }
					| { ok: false; error?: string }
				>(`/api/me/recent-views${qs}`);
				if (cancelled) return;
				if (res.ok && "data" in res) {
					setData({ items: res.data, pagination: res.pagination });
					return;
				}
				setError("Failed to load history");
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load history");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [page, limit, nonce, sessionFetch]);

	return useMemo(
		() => ({ data, isLoading, error, refetch }),
		[data, isLoading, error, refetch],
	);
}
