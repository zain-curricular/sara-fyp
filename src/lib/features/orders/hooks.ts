// ============================================================================
// Orders — Client Hooks
// ============================================================================
//
// React Query hooks for order data and mutations. All hooks attach the
// Supabase session token via useAuthenticatedFetch. Cache is keyed by
// role and orderId to allow independent invalidation.

"use client";

import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";

import type { Order } from "@/lib/features/orders/types";
import type { PlaceOrderInput, ShipOrderInput } from "@/lib/features/orders/schemas";

// ----------------------------------------------------------------------------
// Query key factories
// ----------------------------------------------------------------------------

const orderKeys = {
	buyerList: (status?: string) => ["orders", "buyer", status] as const,
	sellerList: (status?: string) => ["orders", "seller", status] as const,
	detail: (id: string) => ["orders", id] as const,
};

// ----------------------------------------------------------------------------
// Fetch hooks
// ----------------------------------------------------------------------------

/** Fetch all orders where the user is the buyer. */
export function useBuyerOrders(status?: string) {
	const authFetch = useAuthenticatedFetch();

	return useQuery<Order[], Error>({
		queryKey: orderKeys.buyerList(status),
		queryFn: async () => {
			const qs = `role=buyer${status ? `&status=${encodeURIComponent(status)}` : ""}`;
			const res = await authFetch<
				{ ok: true; data: Order[] } | { ok: false; error: string }
			>(`/api/orders?${qs}`);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to load orders");
			return res.data;
		},
		staleTime: 30_000,
	});
}

/** Fetch all orders where the user is the seller. */
export function useSellerOrders(status?: string) {
	const authFetch = useAuthenticatedFetch();

	return useQuery<Order[], Error>({
		queryKey: orderKeys.sellerList(status),
		queryFn: async () => {
			const qs = `role=seller${status ? `&status=${encodeURIComponent(status)}` : ""}`;
			const res = await authFetch<
				{ ok: true; data: Order[] } | { ok: false; error: string }
			>(`/api/orders?${qs}`);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to load orders");
			return res.data;
		},
		staleTime: 30_000,
	});
}

/** Fetch a single order detail. Works for buyer and seller. */
export function useOrderDetail(orderId: string | null) {
	const authFetch = useAuthenticatedFetch();

	return useQuery<Order, Error>({
		queryKey: orderKeys.detail(orderId ?? ""),
		enabled: Boolean(orderId),
		queryFn: async () => {
			const res = await authFetch<
				{ ok: true; data: Order } | { ok: false; error: string }
			>(`/api/orders/${encodeURIComponent(orderId!)}`);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to load order");
			return res.data;
		},
		staleTime: 15_000,
	});
}

// ----------------------------------------------------------------------------
// Mutation hooks
// ----------------------------------------------------------------------------

/** Place a new order from cart. Redirects to success page on completion. */
export function usePlaceOrder() {
	const authFetch = useAuthenticatedFetch();
	const router = useRouter();
	const qc = useQueryClient();

	return useMutation<{ orderId: string; orderNumber: string }, Error, PlaceOrderInput>({
		mutationFn: async (body) => {
			const res = await authFetch<
				{ ok: true; data: { orderId: string; orderNumber: string } } | { ok: false; error: string }
			>("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to place order");
			return res.data;
		},
		onSuccess: ({ orderId }) => {
			void qc.invalidateQueries({ queryKey: ["cart"] });
			void qc.invalidateQueries({ queryKey: ["orders"] });
			router.push(`/checkout/success/${encodeURIComponent(orderId)}`);
		},
	});
}

/** Buyer confirms receipt of delivered order. */
export function useConfirmReceipt() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { orderId: string }>({
		mutationFn: async ({ orderId }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/orders/${encodeURIComponent(orderId)}/confirm-receipt`,
				{ method: "POST" },
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to confirm receipt");
		},
		onSuccess: (_data, { orderId }) => {
			void qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
			void qc.invalidateQueries({ queryKey: orderKeys.buyerList() });
		},
	});
}

/** Seller accepts a pending_payment / paid_escrow order. */
export function useAcceptOrder() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { orderId: string }>({
		mutationFn: async ({ orderId }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/orders/${encodeURIComponent(orderId)}/accept`,
				{ method: "POST" },
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to accept order");
		},
		onSuccess: (_data, { orderId }) => {
			void qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
			void qc.invalidateQueries({ queryKey: orderKeys.sellerList() });
		},
	});
}

/** Seller marks order as shipped with tracking info. */
export function useShipOrder() {
	const authFetch = useAuthenticatedFetch();
	const qc = useQueryClient();

	return useMutation<void, Error, { orderId: string } & ShipOrderInput>({
		mutationFn: async ({ orderId, ...body }) => {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/orders/${encodeURIComponent(orderId)}/ship`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);
			if (!res.ok) throw new Error("error" in res ? res.error : "Failed to ship order");
		},
		onSuccess: (_data, { orderId }) => {
			void qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
			void qc.invalidateQueries({ queryKey: orderKeys.sellerList() });
		},
	});
}
