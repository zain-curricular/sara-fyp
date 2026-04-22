"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { CreateListingWizardInput } from "@/lib/features/listings/schemas";
import type { ListingRecord, ListingsPagination } from "@/lib/features/listings/types";

type Loadable<T> = {
	data: T | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
};

/** Client search when not using an RSC `initial` payload. `apiQuery` is e.g. `?platform=mobile&page=1`. */
export function useSearchListings(
	apiQuery: string,
	initial?: { listings: ListingRecord[]; pagination: ListingsPagination },
): Loadable<{ listings: ListingRecord[]; pagination: ListingsPagination }> {
	const [fetched, setFetched] = useState<{
		listings: ListingRecord[];
		pagination: ListingsPagination;
	} | null>(initial ? { listings: initial.listings, pagination: initial.pagination } : null);
	const [isLoading, setIsLoading] = useState(initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => {
		if (initial === undefined) setNonce((v) => v + 1);
	}, [initial]);

	useEffect(() => {
		if (initial !== undefined) return;

		let cancelled = false;
		async function run() {
			setIsLoading(true);
			setError(null);
			try {
				const qs = apiQuery.startsWith("?") ? apiQuery : apiQuery ? `?${apiQuery}` : "";
				const result = await apiFetch<
					| { ok: true; data: ListingRecord[]; pagination: ListingsPagination }
					| { ok: false; error: string }
				>(`/api/listings${qs}`);
				if (cancelled) return;
				if ("ok" in result && result.ok) {
					setFetched({ listings: result.data, pagination: result.pagination });
					return;
				}
				setError("Failed to search listings");
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to search listings");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [initial, nonce, apiQuery]);

	const loading = initial !== undefined ? false : isLoading;

	return useMemo(() => {
		const resolved =
			initial !== undefined
				? { listings: initial.listings, pagination: initial.pagination }
				: fetched;
		return {
			data: resolved ?? null,
			isLoading: loading,
			error,
			refetch,
		};
	}, [initial, fetched, loading, error, refetch]);
}

export function useListingDetail(
	listingId: string | null,
	initial?: ListingRecord,
): Loadable<ListingRecord> {
	const [fetched, setFetched] = useState<ListingRecord | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(listingId) && initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => {
		if (initial === undefined) setNonce((v) => v + 1);
	}, [initial]);

	useEffect(() => {
		if (!listingId) return;
		if (initial !== undefined) return;

		const id = listingId;
		let cancelled = false;
		async function run() {
			setIsLoading(true);
			setError(null);
			try {
				const supabase = createBrowserSupabaseClient();
				const {
					data: { session },
				} = await supabase.auth.getSession();
				const result = await apiFetch<{ ok: true; data: ListingRecord } | { ok: false; error: string }>(
					`/api/listings/${encodeURIComponent(id)}`,
					{ accessToken: session?.access_token },
				);
				if (cancelled) return;
				if ("ok" in result && result.ok) {
					setFetched(result.data);
					return;
				}
				setError("Failed to load listing");
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load listing");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [listingId, initial, nonce]);

	const loading = Boolean(listingId) && initial === undefined ? isLoading : false;

	return useMemo(() => {
		const resolved = !listingId ? null : initial !== undefined ? initial : fetched;
		return { data: resolved, isLoading: loading, error, refetch };
	}, [listingId, initial, fetched, loading, error, refetch]);
}

export function useCreateListing() {
	const authFetch = useAuthenticatedFetch();

	return useCallback(
		async (body: CreateListingWizardInput) => {
			const result = await authFetch<{ ok: true; data: ListingRecord } | { ok: false; error: string }>(
				"/api/listings",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);
			if ("ok" in result && result.ok) return result.data;
			throw new Error("ok" in result && !result.ok ? result.error : "Failed to create listing");
		},
		[authFetch],
	);
}

export function useUpdateListing() {
	const authFetch = useAuthenticatedFetch();

	return useCallback(
		async (listingId: string, patch: Partial<CreateListingWizardInput>) => {
			const result = await authFetch<{ ok: true; data: ListingRecord } | { ok: false; error: string }>(
				`/api/listings/${encodeURIComponent(listingId)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(patch),
				},
			);
			if ("ok" in result && result.ok) return result.data;
			throw new Error("ok" in result && !result.ok ? result.error : "Failed to update listing");
		},
		[authFetch],
	);
}

export function useUploadImages() {
	return useCallback(async (listingId: string, file: File) => {
		const supabase = createBrowserSupabaseClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		const form = new FormData();
		form.set("file", file);
		return apiFetchFormData<{ ok: true; data: unknown }>(`/api/listings/${encodeURIComponent(listingId)}/images`, form, {
			accessToken: session?.access_token,
		});
	}, []);
}

export function usePublishListing() {
	const authFetch = useAuthenticatedFetch();

	return useCallback(
		async (listingId: string) => {
			const result = await authFetch<{ ok: true; data: ListingRecord } | { ok: false; error: string }>(
				`/api/listings/${encodeURIComponent(listingId)}/publish`,
				{ method: "POST" },
			);
			if ("ok" in result && result.ok) return result.data;
			throw new Error("ok" in result && !result.ok ? result.error : "Failed to publish");
		},
		[authFetch],
	);
}
