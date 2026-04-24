// ============================================================================
// Addresses — Client Hooks
// ============================================================================
//
// React Query hooks for saved address CRUD. All mutations invalidate the
// addresses list on success. useDeleteAddress and useSetDefaultAddress operate
// on a known addressId — list is invalidated to reflect the change.

"use client";

import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";

import type { SavedAddress } from "./types";
import type { AddressInput } from "./schemas";

// ----------------------------------------------------------------------------
// Query keys
// ----------------------------------------------------------------------------

const addressKeys = {
	list: () => ["addresses"] as const,
};

// ----------------------------------------------------------------------------
// Fetch hooks
// ----------------------------------------------------------------------------

/** Fetch the authenticated user's saved addresses. */
export function useAddresses() {
	const authFetch = useAuthenticatedFetch();

	return useQuery<SavedAddress[], Error>({
		queryKey: addressKeys.list(),
		queryFn: async () => {
			const res = await authFetch<
				{ ok: true; data: SavedAddress[] } | { ok: false; error: string }
			>("/api/addresses");
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to load addresses");
			return res.data;
		},
		staleTime: 30_000,
	});
}

// ----------------------------------------------------------------------------
// Mutation hooks
// ----------------------------------------------------------------------------

/** Create a new saved address. */
export function useCreateAddress() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<SavedAddress, Error, AddressInput>({
		mutationFn: async (body) => {
			const res = await authFetch<
				{ ok: true; data: SavedAddress } | { ok: false; error: string }
			>("/api/addresses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to create address");
			return res.data;
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: addressKeys.list() });
		},
	});
}

/** Update an existing saved address. */
export function useUpdateAddress() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { addressId: string } & AddressInput>({
		mutationFn: async ({ addressId, ...body }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/addresses/${encodeURIComponent(addressId)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to update address");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: addressKeys.list() });
		},
	});
}

/** Delete a saved address. */
export function useDeleteAddress() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { addressId: string }>({
		mutationFn: async ({ addressId }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/addresses/${encodeURIComponent(addressId)}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to delete address");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: addressKeys.list() });
		},
	});
}

/** Set an address as the default. */
export function useSetDefaultAddress() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { addressId: string }>({
		mutationFn: async ({ addressId }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/addresses/${encodeURIComponent(addressId)}/default`,
				{ method: "POST" },
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to set default");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: addressKeys.list() });
		},
	});
}
