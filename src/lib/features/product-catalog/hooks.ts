"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Brand, CatalogVariant, Model } from "@/lib/features/product-catalog/types";

type Loadable<T> = {
	data: T | null;
	isLoading: boolean;
	error: string | null;
	/** Re-fetches only when no server `initial` was provided (client-only mode). */
	refetch: () => void;
};

async function fetchJson<T>(path: string): Promise<T> {
	const response = await fetch(path, { headers: { Accept: "application/json" } });
	if (!response.ok) {
		throw new Error(response.statusText || "Request failed");
	}
	return response.json() as Promise<T>;
}

/**
 * Client catalog loaders for routes without an RSC parent. When `initial` is
 * passed from `page.tsx`, no client fetch runs — data comes from props only.
 */
export function useBrands(initial?: Brand[]): Loadable<Brand[]> {
	const [fetched, setFetched] = useState<Brand[] | null>(null);
	const [isLoading, setIsLoading] = useState(initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const data = initial !== undefined ? initial : fetched;

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
				const result = await fetchJson<{ ok: true; data: Brand[] } | { ok: false; error: string }>(
					"/api/catalog/brands",
				);
				if (cancelled) return;
				if ("ok" in result && result.ok) {
					setFetched(result.data);
					return;
				}
				setError("Failed to load brands");
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load brands");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [initial, nonce]);

	return useMemo(
		() => ({ data, isLoading: initial !== undefined ? false : isLoading, error, refetch }),
		[data, initial, isLoading, error, refetch],
	);
}

export function useModels(brandId: string | null, initial?: Model[]): Loadable<Model[]> {
	const [fetched, setFetched] = useState<Model[] | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(brandId) && initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const data =
		!brandId ? null : initial !== undefined ? initial : fetched;

	const refetch = useCallback(() => {
		if (initial === undefined) setNonce((v) => v + 1);
	}, [initial]);

	useEffect(() => {
		if (!brandId) return;
		if (initial !== undefined) return;

		const id = brandId;
		let cancelled = false;
		async function run() {
			setIsLoading(true);
			setError(null);
			try {
				const result = await fetchJson<{ ok: true; data: Model[] } | { ok: false; error: string }>(
					`/api/catalog/brands/${encodeURIComponent(id)}/models`,
				);
				if (cancelled) return;
				if ("ok" in result && result.ok) {
					setFetched(result.data);
					return;
				}
				setError("Failed to load models");
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load models");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [brandId, initial, nonce]);

	const loading =
		Boolean(brandId) && initial === undefined ? isLoading : false;

	return useMemo(
		() => ({ data, isLoading: loading, error, refetch }),
		[data, loading, error, refetch],
	);
}

export function useVariants(
	modelId: string | null,
	initial?: CatalogVariant[],
): Loadable<CatalogVariant[]> {
	const [fetched, setFetched] = useState<CatalogVariant[] | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(modelId) && initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const data =
		!modelId ? null : initial !== undefined ? initial : fetched;

	const refetch = useCallback(() => {
		if (initial === undefined) setNonce((v) => v + 1);
	}, [initial]);

	useEffect(() => {
		if (!modelId) return;
		if (initial !== undefined) return;

		const id = modelId;
		let cancelled = false;
		async function run() {
			setIsLoading(true);
			setError(null);
			try {
				const result = await fetchJson<
					{ ok: true; data: CatalogVariant[] } | { ok: false; error: string }
				>(`/api/catalog/models/${encodeURIComponent(id)}/variants`);
				if (cancelled) return;
				if ("ok" in result && result.ok) {
					setFetched(result.data);
					return;
				}
				setError("Failed to load variants");
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load variants");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		void run();
		return () => {
			cancelled = true;
		};
	}, [modelId, initial, nonce]);

	const loading =
		Boolean(modelId) && initial === undefined ? isLoading : false;

	return useMemo(
		() => ({ data, isLoading: loading, error, refetch }),
		[data, loading, error, refetch],
	);
}
