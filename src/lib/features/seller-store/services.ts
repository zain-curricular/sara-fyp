// ============================================================================
// Seller Store — Server Services
// ============================================================================
//
// Data access and business logic for seller store management and analytics.
// All functions return { data, error } — never throw.
//
// Services:
//   getStoreByOwner   — fetch store row by owner_id
//   getStoreBySlug    — fetch store row by slug (public)
//   updateStore       — patch store fields
//   getSellerAnalytics — aggregate revenue, orders, listings for dashboard

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
	AnalyticsPayload,
	OrdersByStatus,
	RevenueByDay,
	SellerStore,
	TopListing,
} from "./types";

// ----------------------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------------------

function mapStoreRow(row: Record<string, unknown>): SellerStore {
	return {
		id: row.id as string,
		ownerId: row.owner_id as string,
		storeName: (row.name as string) ?? "",
		slug: row.slug as string,
		logoUrl: (row.logo_url as string | null) ?? null,
		bannerUrl: (row.banner_url as string | null) ?? null,
		city: (row.city as string) ?? "",
		description: (row.description as string) ?? "",
		verified: (row.verified as boolean) ?? false,
		rating: (row.rating as number) ?? 0,
		reviewCount: (row.review_count as number) ?? 0,
		createdAt: row.created_at as string,
	};
}

// ----------------------------------------------------------------------------
// Exported functions
// ----------------------------------------------------------------------------

/** Fetch a seller's own store by their user ID. */
export async function getStoreByOwner(
	ownerId: string,
): Promise<{ data: SellerStore | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("seller_stores")
		.select("id, owner_id, name, slug, logo_url, banner_url, city, description, verified, rating, review_count, created_at")
		.eq("owner_id", ownerId)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!data) return { data: null, error: null };

	return { data: mapStoreRow(data as Record<string, unknown>), error: null };
}

/** Fetch a seller store by its slug (public lookup). */
export async function getStoreBySlug(
	slug: string,
): Promise<{ data: SellerStore | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("seller_stores")
		.select("id, owner_id, name, slug, logo_url, banner_url, city, description, verified, rating, review_count, created_at")
		.eq("slug", slug)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!data) return { data: null, error: null };

	return { data: mapStoreRow(data as Record<string, unknown>), error: null };
}

/** Patch allowed store fields. Skips undefined values. */
export async function updateStore(
	ownerId: string,
	updates: {
		storeName?: string;
		city?: string;
		description?: string;
		logoUrl?: string | null;
		bannerUrl?: string | null;
	},
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Build patch omitting undefined
	const patch: Record<string, unknown> = {};
	if (updates.storeName !== undefined) patch.name = updates.storeName;
	if (updates.city !== undefined) patch.city = updates.city;
	if (updates.description !== undefined) patch.description = updates.description;
	if (updates.logoUrl !== undefined) patch.logo_url = updates.logoUrl;
	if (updates.bannerUrl !== undefined) patch.banner_url = updates.bannerUrl;

	if (Object.keys(patch).length === 0) return { error: null };

	const { error } = await supabase
		.from("seller_stores")
		.update(patch)
		.eq("owner_id", ownerId);

	return { error };
}

/** Aggregate analytics for the seller dashboard (last 30 days). */
export async function getSellerAnalytics(
	sellerId: string,
): Promise<{ data: AnalyticsPayload | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const sinceDate = new Date();
	sinceDate.setDate(sinceDate.getDate() - 30);
	const since = sinceDate.toISOString();

	// Fetch completed/shipped/delivered orders in last 30d
	const { data: orders, error: ordersError } = await supabase
		.from("orders")
		.select("id, total, ss_status, placed_at")
		.eq("seller_id", sellerId)
		.in("ss_status", ["completed", "shipped", "delivered"])
		.gte("placed_at", since)
		.order("placed_at", { ascending: true });

	if (ordersError) return { data: null, error: ordersError };

	// Fetch all orders for status counts
	const { data: allOrders, error: allError } = await supabase
		.from("orders")
		.select("id, ss_status")
		.eq("seller_id", sellerId);

	if (allError) return { data: null, error: allError };

	// Fetch order items to identify top listings
	const orderIds = (orders ?? []).map((o) => (o as Record<string, unknown>).id as string);

	let orderItems: Record<string, unknown>[] = [];
	if (orderIds.length > 0) {
		const { data: items, error: itemsError } = await supabase
			.from("order_items")
			.select("listing_id, listing_snapshot, line_total")
			.in("order_id", orderIds);

		if (itemsError) return { data: null, error: itemsError };
		orderItems = (items ?? []) as Record<string, unknown>[];
	}

	// Fetch active listing count
	const { count: activeListings } = await supabase
		.from("listings")
		.select("id", { count: "exact", head: true })
		.eq("user_id", sellerId)
		.eq("status", "active")
		.is("deleted_at", null);

	// --- Build revenueByDay ---
	const revenueMap = new Map<string, number>();
	for (const order of orders ?? []) {
		const o = order as Record<string, unknown>;
		const day = (o.placed_at as string).slice(0, 10);
		revenueMap.set(day, (revenueMap.get(day) ?? 0) + (o.total as number));
	}

	// Fill all 30 days (even zero-revenue days)
	const revenueByDay: RevenueByDay[] = [];
	for (let i = 29; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const day = d.toISOString().slice(0, 10);
		revenueByDay.push({ date: day, revenue: revenueMap.get(day) ?? 0 });
	}

	// --- Build ordersByStatus ---
	const statusMap = new Map<string, number>();
	for (const order of allOrders ?? []) {
		const o = order as Record<string, unknown>;
		const s = o.ss_status as string;
		statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
	}
	const ordersByStatus: OrdersByStatus[] = Array.from(statusMap.entries()).map(([status, count]) => ({
		status,
		count,
	}));

	// --- Build topListings ---
	const listingRevMap = new Map<string, { title: string; revenue: number; orders: number }>();
	for (const item of orderItems) {
		const listingId = item.listing_id as string;
		const snap = item.listing_snapshot as Record<string, unknown> | null;
		const title = (snap?.title as string) ?? "Unknown";
		const lineTotal = item.line_total as number;

		const existing = listingRevMap.get(listingId);
		if (existing) {
			existing.revenue += lineTotal;
			existing.orders += 1;
		} else {
			listingRevMap.set(listingId, { title, revenue: lineTotal, orders: 1 });
		}
	}

	const topListings: TopListing[] = Array.from(listingRevMap.entries())
		.map(([id, v]) => ({ id, ...v }))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 5);

	// --- KPIs ---
	const totalRevenue = (orders ?? []).reduce(
		(sum, o) => sum + ((o as Record<string, unknown>).total as number),
		0,
	);
	const totalOrders = (orders ?? []).length;
	const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

	return {
		data: {
			revenueByDay,
			topListings,
			ordersByStatus,
			kpis: {
				totalRevenue,
				totalOrders,
				avgOrderValue,
				activeListings: activeListings ?? 0,
			},
		},
		error: null,
	};
}
