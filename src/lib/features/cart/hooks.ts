// ============================================================================
// Cart — Client Hooks
// ============================================================================
//
// React Query hooks for cart state and mutations. All hooks use the
// authenticated fetch helper to attach the Supabase session token.
// staleTime = 30s keeps cart data fresh without hammering the API.

"use client";

import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import type { Cart, CartItem } from "@/lib/features/cart/types";
import type { AddToCartInput, UpdateCartItemInput } from "@/lib/features/cart/schemas";

// ----------------------------------------------------------------------------
// Query keys
// ----------------------------------------------------------------------------

const CART_KEY = ["cart"] as const;

// ----------------------------------------------------------------------------
// Fetch hook
// ----------------------------------------------------------------------------

/** Fetch the current user's cart (grouped by seller). Stale after 30s. */
export function useCart() {
	const authFetch = useAuthenticatedFetch();

	return useQuery<Cart, Error>({
		queryKey: CART_KEY,
		queryFn: async () => {
			const res = await authFetch<{ ok: true; data: Cart } | { ok: false; error: string }>(
				"/api/cart",
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to load cart");
			return res.data;
		},
		staleTime: 30_000,
		retry: 1,
	});
}

// ----------------------------------------------------------------------------
// Mutation hooks
// ----------------------------------------------------------------------------

/** Add a listing to cart. Invalidates cart on success. */
export function useAddToCart() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<CartItem, Error, AddToCartInput>({
		mutationFn: async (body) => {
			const res = await authFetch<{ ok: true; data: CartItem } | { ok: false; error: string }>(
				"/api/cart/items",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to add to cart");
			return res.data;
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: CART_KEY });
		},
	});
}

/** Update qty of a cart item. Optimistically updates then invalidates on settle. */
export function useUpdateCartItem() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { cartItemId: string } & UpdateCartItemInput>({
		mutationFn: async ({ cartItemId, qty }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/cart/items/${encodeURIComponent(cartItemId)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ qty }),
				},
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to update item");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: CART_KEY });
		},
	});
}

/** Remove a cart item. Invalidates cart on success. */
export function useRemoveCartItem() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { cartItemId: string }>({
		mutationFn: async ({ cartItemId }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/cart/items/${encodeURIComponent(cartItemId)}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to remove item");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: CART_KEY });
		},
	});
}
