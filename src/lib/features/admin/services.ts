// ============================================================================
// Admin Feature — Server Services
// ============================================================================
//
// All admin operations that bypass RLS via the service-role client.
// Every function returns { data, error } — never throws.
//
// Pattern:
//   1. createAdminSupabaseClient() — service-role client, bypasses RLS
//   2. Query / mutate
//   3. Return { data, error }
//
// Side effects:
//   - banUser inserts an admin_actions row after updating profiles
//   - approveListing / rejectListing notify the seller via notifications
//   - resolveDispute updates order + escrow_transactions

import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import type {
	AdminAction,
	AdminCategory,
	AdminDispute,
	AdminKPIs,
	AdminListing,
	AdminMechanic,
	AdminOrder,
	AdminPayout,
	AdminSeller,
	AdminUser,
	AdminVehicle,
	FraudSignal,
	KBDocument,
	PlatformSetting,
} from "./types";

// ============================================================================
// KPIs
// ============================================================================

/** Aggregate platform KPIs for the admin dashboard. */
export async function getAdminKPIs(): Promise<{ data: AdminKPIs | null; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayIso = today.toISOString();

	const [users, sellers, listings, ordersToday, disputes, fraud] = await Promise.all([
		supabase.from("profiles").select("id", { count: "exact", head: true }),
		supabase
			.from("profiles")
			.select("id", { count: "exact", head: true })
			.contains("roles", ["seller"]),
		supabase
			.from("listings")
			.select("id", { count: "exact", head: true })
			.eq("status", "active")
			.is("deleted_at", null),
		supabase
			.from("orders")
			.select("id, total", { count: "exact" })
			.gte("placed_at", todayIso),
		supabase
			.from("disputes")
			.select("id", { count: "exact", head: true })
			.in("status", ["open", "under_review"]),
		supabase
			.from("fraud_signals")
			.select("id", { count: "exact", head: true })
			.eq("status", "open"),
	]);

	// GMV today — sum the totals from today's orders
	const gmvToday = ((ordersToday.data ?? []) as Array<{ total: number }>).reduce(
		(sum, o) => sum + (o.total ?? 0),
		0,
	);

	const data: AdminKPIs = {
		totalUsers: users.count ?? 0,
		totalSellers: sellers.count ?? 0,
		activeListings: listings.count ?? 0,
		ordersToday: ordersToday.count ?? 0,
		gmvToday,
		openDisputes: disputes.count ?? 0,
		openFraudSignals: (fraud as { count: number | null }).count ?? 0,
		pendingMechanicVerifications: 0, // mechanic_profiles table may not exist yet
	};

	return { data, error: null };
}

// ============================================================================
// Users
// ============================================================================

/** List all users with optional search + role filter. */
export async function listAdminUsers(
	search?: string,
	role?: string,
): Promise<{ data: AdminUser[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	let q = supabase
		.from("profiles")
		.select("id, email, full_name, roles, active_role, city, created_at, is_banned")
		.order("created_at", { ascending: false })
		.limit(200);

	if (search) {
		q = q.or(
			`full_name.ilike.%${search}%,email.ilike.%${search}%`,
		);
	}

	if (role && role !== "all") {
		q = q.contains("roles", [role]);
	}

	const { data, error } = await q;
	if (error) return { data: [], error };

	const rows = (data ?? []) as Array<Record<string, unknown>>;

	return {
		data: rows.map((r) => ({
			id: r.id as string,
			email: (r.email as string) ?? "",
			fullName: (r.full_name as string | null) ?? null,
			roles: (r.roles as string[]) ?? ["buyer"],
			activeRole: (r.active_role as string) ?? "buyer",
			city: (r.city as string | null) ?? null,
			createdAt: r.created_at as string,
			isBanned: (r.is_banned as boolean) ?? false,
		})),
		error: null,
	};
}

/** Fetch a user with their orders and listings. */
export async function getUserDetail(userId: string): Promise<{
	data: (AdminUser & { orders: AdminOrder[]; listings: AdminListing[]; adminActions: AdminAction[] }) | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const [profileRes, ordersRes, listingsRes, actionsRes] = await Promise.all([
		supabase
			.from("profiles")
			.select("id, email, full_name, roles, active_role, city, created_at, is_banned")
			.eq("id", userId)
			.maybeSingle(),
		supabase
			.from("orders")
			.select("id, order_number, buyer_id, seller_id, total, ss_status, placed_at")
			.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
			.order("placed_at", { ascending: false })
			.limit(50),
		supabase
			.from("listings")
			.select("id, title, user_id, price, status, condition, created_at, view_count")
			.eq("user_id", userId)
			.is("deleted_at", null)
			.order("created_at", { ascending: false })
			.limit(50),
		supabase
			.from("admin_actions")
			.select("id, admin_id, target_type, target_id, action, note, created_at")
			.eq("target_id", userId)
			.order("created_at", { ascending: false })
			.limit(30),
	]);

	if (profileRes.error || !profileRes.data) return { data: null, error: profileRes.error };

	const p = profileRes.data as Record<string, unknown>;

	const orders: AdminOrder[] = ((ordersRes.data ?? []) as Array<Record<string, unknown>>).map((o) => ({
		id: o.id as string,
		orderNumber: o.order_number as string,
		buyerId: o.buyer_id as string,
		sellerId: o.seller_id as string,
		total: o.total as number,
		ssStatus: o.ss_status as string,
		placedAt: o.placed_at as string,
	}));

	const listings: AdminListing[] = ((listingsRes.data ?? []) as Array<Record<string, unknown>>).map(
		(l) => ({
			id: l.id as string,
			title: l.title as string,
			sellerId: l.user_id as string,
			storeName: null,
			price: l.price as number,
			status: l.status as string,
			condition: (l.condition as string) ?? "",
			createdAt: l.created_at as string,
			viewCount: (l.view_count as number) ?? 0,
		}),
	);

	const adminActions: AdminAction[] = ((actionsRes.data ?? []) as Array<Record<string, unknown>>).map(
		(a) => ({
			id: a.id as string,
			adminId: a.admin_id as string,
			targetType: a.target_type as string,
			targetId: a.target_id as string,
			action: a.action as string,
			note: (a.note as string | null) ?? null,
			createdAt: a.created_at as string,
		}),
	);

	return {
		data: {
			id: p.id as string,
			email: (p.email as string) ?? "",
			fullName: (p.full_name as string | null) ?? null,
			roles: (p.roles as string[]) ?? ["buyer"],
			activeRole: (p.active_role as string) ?? "buyer",
			city: (p.city as string | null) ?? null,
			createdAt: p.created_at as string,
			isBanned: (p.is_banned as boolean) ?? false,
			orders,
			listings,
			adminActions,
		},
		error: null,
	};
}

/** Ban a user — sets is_banned = true and records admin_actions row. */
export async function banUser(
	adminId: string,
	userId: string,
	note: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error: updateError } = await supabase
		.from("profiles")
		.update({ is_banned: true })
		.eq("id", userId);

	if (updateError) return { error: updateError };

	const { error: actionError } = await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "user",
		target_id: userId,
		action: "ban_user",
		note,
	});

	return { error: actionError };
}

/** Unban a user — sets is_banned = false and records admin_actions row. */
export async function unbanUser(
	adminId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error: updateError } = await supabase
		.from("profiles")
		.update({ is_banned: false })
		.eq("id", userId);

	if (updateError) return { error: updateError };

	const { error: actionError } = await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "user",
		target_id: userId,
		action: "unban_user",
		note: null,
	});

	return { error: actionError };
}

/** Grant admin role to a user. */
export async function grantAdminRole(
	adminId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	// Fetch current roles first
	const { data: profile, error: fetchErr } = await supabase
		.from("profiles")
		.select("roles")
		.eq("id", userId)
		.maybeSingle();

	if (fetchErr) return { error: fetchErr };

	const currentRoles = (profile?.roles as string[]) ?? ["buyer"];
	if (currentRoles.includes("admin")) return { error: null }; // already admin

	const { error: updateError } = await supabase
		.from("profiles")
		.update({ roles: [...currentRoles, "admin"] })
		.eq("id", userId);

	if (updateError) return { error: updateError };

	await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "user",
		target_id: userId,
		action: "grant_admin",
		note: null,
	});

	return { error: null };
}

// ============================================================================
// Sellers
// ============================================================================

/** List seller stores with owner profile. */
export async function listAdminSellers(): Promise<{ data: AdminSeller[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("seller_stores")
		.select("id, store_name, slug, owner_id, city, verified, rating, review_count, created_at, profiles (full_name)")
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) return { data: [], error };

	const rows = (data ?? []) as Array<Record<string, unknown>>;

	// Count listings per seller
	const sellerIds = rows.map((r) => r.owner_id as string);

	const { data: listingCounts } = await supabase
		.from("listings")
		.select("user_id")
		.in("user_id", sellerIds)
		.is("deleted_at", null)
		.eq("status", "active");

	const countMap: Record<string, number> = {};
	for (const l of (listingCounts ?? []) as Array<{ user_id: string }>) {
		countMap[l.user_id] = (countMap[l.user_id] ?? 0) + 1;
	}

	return {
		data: rows.map((r) => {
			const profile = r.profiles as Record<string, unknown> | null;
			return {
				id: r.id as string,
				storeName: r.store_name as string,
				slug: r.slug as string,
				ownerId: r.owner_id as string,
				ownerName: (profile?.full_name as string | null) ?? null,
				city: (r.city as string) ?? "",
				verified: (r.verified as boolean) ?? false,
				rating: (r.rating as number) ?? 0,
				listingCount: countMap[r.owner_id as string] ?? 0,
				createdAt: r.created_at as string,
			};
		}),
		error: null,
	};
}

/** Get a single seller store detail. */
export async function getSellerDetail(sellerId: string): Promise<{
	data: AdminSeller | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("seller_stores")
		.select(
			"id, store_name, slug, owner_id, city, verified, rating, review_count, created_at, profiles (full_name)",
		)
		.eq("id", sellerId)
		.maybeSingle();

	if (error || !data) return { data: null, error };

	const r = data as Record<string, unknown>;
	const profile = r.profiles as Record<string, unknown> | null;

	return {
		data: {
			id: r.id as string,
			storeName: r.store_name as string,
			slug: r.slug as string,
			ownerId: r.owner_id as string,
			ownerName: (profile?.full_name as string | null) ?? null,
			city: (r.city as string) ?? "",
			verified: (r.verified as boolean) ?? false,
			rating: (r.rating as number) ?? 0,
			listingCount: 0,
			createdAt: r.created_at as string,
		},
		error: null,
	};
}

/** Verify or unverify a seller store. */
export async function setSellerVerified(
	adminId: string,
	sellerId: string,
	verified: boolean,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("seller_stores")
		.update({ verified })
		.eq("id", sellerId);

	if (!error) {
		await supabase.from("admin_actions").insert({
			admin_id: adminId,
			target_type: "seller",
			target_id: sellerId,
			action: verified ? "verify_seller" : "unverify_seller",
			note: null,
		});
	}

	return { error };
}

// ============================================================================
// Listings
// ============================================================================

/** List admin listings, optionally filtered by status + search. */
export async function listAdminListings(
	status?: string,
	search?: string,
): Promise<{ data: AdminListing[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	let q = supabase
		.from("listings")
		.select("id, title, user_id, price, status, condition, created_at, view_count")
		.is("deleted_at", null)
		.order("created_at", { ascending: false })
		.limit(200);

	if (status && status !== "all") {
		q = q.eq("status", status);
	}

	if (search) {
		q = q.ilike("title", `%${search}%`);
	}

	const { data, error } = await q;
	if (error) return { data: [], error };

	const rows = (data ?? []) as Array<Record<string, unknown>>;

	// Fetch store names
	const sellerIds = [...new Set(rows.map((r) => r.user_id as string))];
	const { data: stores } = await supabase
		.from("seller_stores")
		.select("owner_id, store_name")
		.in("owner_id", sellerIds);

	const storeMap: Record<string, string> = {};
	for (const s of (stores ?? []) as Array<{ owner_id: string; store_name: string }>) {
		storeMap[s.owner_id] = s.store_name;
	}

	return {
		data: rows.map((r) => ({
			id: r.id as string,
			title: r.title as string,
			sellerId: r.user_id as string,
			storeName: storeMap[r.user_id as string] ?? null,
			price: r.price as number,
			status: r.status as string,
			condition: (r.condition as string) ?? "",
			createdAt: r.created_at as string,
			viewCount: (r.view_count as number) ?? 0,
		})),
		error: null,
	};
}

/** Get a single listing's full detail for admin review. */
export async function getAdminListingDetail(listingId: string): Promise<{
	data: (AdminListing & {
		description: string | null;
		images: Array<{ url: string; position: number }>;
	}) | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const [listingRes, imagesRes] = await Promise.all([
		supabase
			.from("listings")
			.select("id, title, user_id, price, status, condition, created_at, view_count, description")
			.eq("id", listingId)
			.maybeSingle(),
		supabase
			.from("listing_images")
			.select("url, position")
			.eq("listing_id", listingId)
			.order("position"),
	]);

	if (listingRes.error || !listingRes.data) return { data: null, error: listingRes.error };

	const r = listingRes.data as Record<string, unknown>;

	// Look up store
	const { data: store } = await supabase
		.from("seller_stores")
		.select("store_name")
		.eq("owner_id", r.user_id as string)
		.maybeSingle();

	const images = ((imagesRes.data ?? []) as Array<{ url: string; position: number }>).map((i) => ({
		url: i.url,
		position: i.position,
	}));

	return {
		data: {
			id: r.id as string,
			title: r.title as string,
			sellerId: r.user_id as string,
			storeName: (store as { store_name: string } | null)?.store_name ?? null,
			price: r.price as number,
			status: r.status as string,
			condition: (r.condition as string) ?? "",
			createdAt: r.created_at as string,
			viewCount: (r.view_count as number) ?? 0,
			description: (r.description as string | null) ?? null,
			images,
		},
		error: null,
	};
}

/** Approve a listing — sets status = 'active', notifies seller. */
export async function approveListing(
	adminId: string,
	listingId: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data: listing, error: fetchErr } = await supabase
		.from("listings")
		.select("id, user_id, title")
		.eq("id", listingId)
		.maybeSingle();

	if (fetchErr) return { error: fetchErr };
	if (!listing) return { error: new Error("Listing not found") };

	const l = listing as Record<string, unknown>;

	const { error } = await supabase
		.from("listings")
		.update({ status: "active" })
		.eq("id", listingId);

	if (error) return { error };

	// Notify seller
	await supabase.from("notifications").insert({
		user_id: l.user_id as string,
		type: "listing_approved",
		title: "Listing approved",
		body: `Your listing "${l.title as string}" has been approved and is now live.`,
		entity_type: "listing",
		entity_id: listingId,
	});

	await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "listing",
		target_id: listingId,
		action: "approve_listing",
		note: null,
	});

	return { error: null };
}

/** Reject a listing — sets status = 'rejected', stores reason, notifies seller. */
export async function rejectListing(
	adminId: string,
	listingId: string,
	reason: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data: listing, error: fetchErr } = await supabase
		.from("listings")
		.select("id, user_id, title")
		.eq("id", listingId)
		.maybeSingle();

	if (fetchErr) return { error: fetchErr };
	if (!listing) return { error: new Error("Listing not found") };

	const l = listing as Record<string, unknown>;

	const { error } = await supabase
		.from("listings")
		.update({ status: "rejected", rejection_reason: reason })
		.eq("id", listingId);

	if (error) return { error };

	// Notify seller
	await supabase.from("notifications").insert({
		user_id: l.user_id as string,
		type: "listing_flagged",
		title: "Listing rejected",
		body: `Your listing "${l.title as string}" was rejected. Reason: ${reason}`,
		entity_type: "listing",
		entity_id: listingId,
	});

	await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "listing",
		target_id: listingId,
		action: "reject_listing",
		note: reason,
	});

	return { error: null };
}

// ============================================================================
// Orders
// ============================================================================

/** List all orders with optional status filter. */
export async function listAdminOrders(
	status?: string,
): Promise<{ data: AdminOrder[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	let q = supabase
		.from("orders")
		.select("id, order_number, buyer_id, seller_id, total, ss_status, placed_at")
		.order("placed_at", { ascending: false })
		.limit(200);

	if (status && status !== "all") {
		q = q.eq("ss_status", status);
	}

	const { data, error } = await q;
	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((o) => ({
			id: o.id as string,
			orderNumber: o.order_number as string,
			buyerId: o.buyer_id as string,
			sellerId: o.seller_id as string,
			total: o.total as number,
			ssStatus: o.ss_status as string,
			placedAt: o.placed_at as string,
		})),
		error: null,
	};
}

/** Get a single order's full detail. */
export async function getAdminOrderDetail(orderId: string): Promise<{
	data: (AdminOrder & {
		subtotal: number;
		shippingFee: number;
		platformFee: number;
		items: Array<{ title: string; qty: number; unitPrice: number; lineTotal: number }>;
		shippingAddress: Record<string, unknown>;
		trackingNumber: string | null;
		courierName: string | null;
	}) | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const [orderRes, itemsRes] = await Promise.all([
		supabase
			.from("orders")
			.select(
				"id, order_number, buyer_id, seller_id, total, ss_status, placed_at, subtotal, shipping_fee, platform_fee, shipping_address, tracking_number, courier_name",
			)
			.eq("id", orderId)
			.maybeSingle(),
		supabase
			.from("order_items")
			.select("listing_snapshot, qty, unit_price, line_total")
			.eq("order_id", orderId),
	]);

	if (orderRes.error || !orderRes.data) return { data: null, error: orderRes.error };

	const o = orderRes.data as Record<string, unknown>;

	return {
		data: {
			id: o.id as string,
			orderNumber: o.order_number as string,
			buyerId: o.buyer_id as string,
			sellerId: o.seller_id as string,
			total: o.total as number,
			ssStatus: o.ss_status as string,
			placedAt: o.placed_at as string,
			subtotal: (o.subtotal as number) ?? 0,
			shippingFee: (o.shipping_fee as number) ?? 0,
			platformFee: (o.platform_fee as number) ?? 0,
			shippingAddress: (o.shipping_address as Record<string, unknown>) ?? {},
			trackingNumber: (o.tracking_number as string | null) ?? null,
			courierName: (o.courier_name as string | null) ?? null,
			items: ((itemsRes.data ?? []) as Array<Record<string, unknown>>).map((item) => {
				const snap = item.listing_snapshot as Record<string, unknown>;
				return {
					title: (snap?.title as string) ?? "Unknown item",
					qty: item.qty as number,
					unitPrice: item.unit_price as number,
					lineTotal: item.line_total as number,
				};
			}),
		},
		error: null,
	};
}

/** Force-cancel an order with admin note. */
export async function forceCancelOrder(
	adminId: string,
	orderId: string,
	reason: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("orders")
		.update({ ss_status: "cancelled" })
		.eq("id", orderId);

	if (!error) {
		await supabase.from("admin_actions").insert({
			admin_id: adminId,
			target_type: "order",
			target_id: orderId,
			action: "force_cancel",
			note: reason,
		});
	}

	return { error };
}

// ============================================================================
// Disputes
// ============================================================================

/** List disputes for admin, optionally filtered by status. */
export async function listAdminDisputes(
	status?: string,
): Promise<{ data: AdminDispute[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	let q = supabase
		.from("disputes")
		.select("id, order_id, opened_by, reason, status, created_at, resolution_note, orders (order_number)")
		.order("created_at", { ascending: true }) // oldest first — priority
		.limit(200);

	if (status && status !== "all") {
		const statusList = status.split(",").map((s) => s.trim());
		q = q.in("status", statusList);
	}

	const { data, error } = await q;
	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((d) => {
			const order = d.orders as Record<string, unknown> | null;
			return {
				id: d.id as string,
				orderId: d.order_id as string,
				orderNumber: (order?.order_number as string) ?? "",
				openedBy: d.opened_by as string,
				reason: d.reason as string,
				status: d.status as string,
				createdAt: d.created_at as string,
				resolutionNote: (d.resolution_note as string | null) ?? null,
			};
		}),
		error: null,
	};
}

/** Get a single dispute with full evidence + order detail. */
export async function getAdminDisputeDetail(disputeId: string): Promise<{
	data: (AdminDispute & {
		description: string;
		evidenceUrls: string[];
		sellerReply: string | null;
		resolvedAt: string | null;
		order: {
			orderNumber: string;
			buyerId: string;
			sellerId: string;
			total: number;
			ssStatus: string;
		} | null;
	}) | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("disputes")
		.select(
			`id, order_id, opened_by, reason, description, evidence_urls, status,
			resolution_note, resolved_at, seller_reply, created_at,
			orders (order_number, buyer_id, seller_id, total, ss_status)`,
		)
		.eq("id", disputeId)
		.maybeSingle();

	if (error || !data) return { data: null, error };

	const d = data as Record<string, unknown>;
	const order = d.orders as Record<string, unknown> | null;

	return {
		data: {
			id: d.id as string,
			orderId: d.order_id as string,
			orderNumber: (order?.order_number as string) ?? "",
			openedBy: d.opened_by as string,
			reason: d.reason as string,
			status: d.status as string,
			createdAt: d.created_at as string,
			resolutionNote: (d.resolution_note as string | null) ?? null,
			description: (d.description as string) ?? "",
			evidenceUrls: (d.evidence_urls as string[]) ?? [],
			sellerReply: (d.seller_reply as string | null) ?? null,
			resolvedAt: (d.resolved_at as string | null) ?? null,
			order: order
				? {
						orderNumber: order.order_number as string,
						buyerId: order.buyer_id as string,
						sellerId: order.seller_id as string,
						total: order.total as number,
						ssStatus: order.ss_status as string,
					}
				: null,
		},
		error: null,
	};
}

/** Resolve a dispute in favour of buyer or seller. */
export async function resolveDispute(
	adminId: string,
	disputeId: string,
	resolution: "resolved_buyer" | "resolved_seller",
	note: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	// Fetch dispute + order
	const { data: disputeRow, error: fetchErr } = await supabase
		.from("disputes")
		.select("id, order_id, status, orders (id, ss_status)")
		.eq("id", disputeId)
		.maybeSingle();

	if (fetchErr) return { error: fetchErr };
	if (!disputeRow) return { error: new Error("Dispute not found") };

	const d = disputeRow as Record<string, unknown>;
	const order = d.orders as Record<string, unknown> | null;
	const orderId = d.order_id as string;

	// Determine new order status
	const newOrderStatus =
		resolution === "resolved_buyer" ? "refunded" : "completed";

	// Update dispute
	const { error: disputeErr } = await supabase
		.from("disputes")
		.update({
			status: resolution,
			resolution_note: note,
			resolved_by: adminId,
			resolved_at: new Date().toISOString(),
		})
		.eq("id", disputeId);

	if (disputeErr) return { error: disputeErr };

	// Transition order status
	await supabase
		.from("orders")
		.update({ ss_status: newOrderStatus })
		.eq("id", orderId);

	// Update escrow transaction status
	await supabase
		.from("escrow_transactions")
		.update({ ss_status: newOrderStatus })
		.eq("order_id", orderId);

	await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "dispute",
		target_id: disputeId,
		action: resolution,
		note,
	});

	void order; // suppress unused var
	return { error: null };
}

// ============================================================================
// Fraud Signals
// ============================================================================

/** List fraud signals with optional status filter. */
export async function listFraudSignals(
	status?: string,
): Promise<{ data: FraudSignal[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	let q = supabase
		.from("fraud_signals")
		.select("id, subject_type, subject_id, signal_type, score, status, created_at, details")
		.order("created_at", { ascending: false })
		.limit(200);

	if (status && status !== "all") {
		q = q.eq("status", status);
	}

	const { data, error } = await q;
	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((f) => ({
			id: f.id as string,
			subjectType: f.subject_type as string,
			subjectId: f.subject_id as string,
			signalType: f.signal_type as string,
			score: (f.score as number) ?? 0,
			status: f.status as string,
			createdAt: f.created_at as string,
			details: (f.details as Record<string, unknown>) ?? {},
		})),
		error: null,
	};
}

/** Dismiss a fraud signal. */
export async function dismissFraudSignal(
	adminId: string,
	signalId: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("fraud_signals")
		.update({ status: "dismissed" })
		.eq("id", signalId);

	if (!error) {
		await supabase.from("admin_actions").insert({
			admin_id: adminId,
			target_type: "fraud_signal",
			target_id: signalId,
			action: "dismiss_fraud",
			note: null,
		});
	}

	return { error };
}

/** Action a fraud signal (take action, record note). */
export async function actionFraudSignal(
	adminId: string,
	signalId: string,
	note: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("fraud_signals")
		.update({ status: "actioned" })
		.eq("id", signalId);

	if (!error) {
		await supabase.from("admin_actions").insert({
			admin_id: adminId,
			target_type: "fraud_signal",
			target_id: signalId,
			action: "action_fraud",
			note,
		});
	}

	return { error };
}

// ============================================================================
// Mechanics
// ============================================================================

/** List all mechanic profiles. */
export async function listAdminMechanics(): Promise<{ data: AdminMechanic[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("mechanic_profiles")
		.select(
			"id, full_name, specialties, service_areas, verified_at, total_jobs, rating, created_at",
		)
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) {
		// mechanic_profiles may not exist — return empty gracefully
		return { data: [], error: null };
	}

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((m) => ({
			id: m.id as string,
			fullName: (m.full_name as string | null) ?? null,
			specialties: (m.specialties as string[]) ?? [],
			serviceAreas: (m.service_areas as string[]) ?? [],
			verified: !!(m.verified_at as string | null),
			verifiedAt: (m.verified_at as string | null) ?? null,
			totalJobs: (m.total_jobs as number) ?? 0,
			rating: (m.rating as number) ?? 0,
			createdAt: m.created_at as string,
		})),
		error: null,
	};
}

/** Toggle mechanic verified status. */
export async function setMechanicVerified(
	adminId: string,
	mechanicId: string,
	verified: boolean,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("mechanic_profiles")
		.update({ verified_at: verified ? new Date().toISOString() : null })
		.eq("id", mechanicId);

	if (!error) {
		await supabase.from("admin_actions").insert({
			admin_id: adminId,
			target_type: "mechanic",
			target_id: mechanicId,
			action: verified ? "verify_mechanic" : "unverify_mechanic",
			note: null,
		});
	}

	return { error };
}

// ============================================================================
// Categories
// ============================================================================

/** List all part categories with parent name + child count. */
export async function listAdminCategories(): Promise<{ data: AdminCategory[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("part_categories")
		.select("id, name, slug, parent_id")
		.order("name");

	if (error) return { data: [], error };

	const rows = (data ?? []) as Array<{ id: string; name: string; slug: string; parent_id: string | null }>;

	// Build name map + child count map
	const nameMap: Record<string, string> = {};
	const childCount: Record<string, number> = {};

	for (const r of rows) {
		nameMap[r.id] = r.name;
	}
	for (const r of rows) {
		if (r.parent_id) {
			childCount[r.parent_id] = (childCount[r.parent_id] ?? 0) + 1;
		}
	}

	return {
		data: rows.map((r) => ({
			id: r.id,
			name: r.name,
			slug: r.slug,
			parentId: r.parent_id ?? null,
			parentName: r.parent_id ? (nameMap[r.parent_id] ?? null) : null,
			childCount: childCount[r.id] ?? 0,
			listingCount: 0,
		})),
		error: null,
	};
}

/** Create a new category. */
export async function createCategory(
	name: string,
	slug: string,
	parentId: string | null,
): Promise<{ data: { id: string } | null; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("part_categories")
		.insert({ name, slug, parent_id: parentId ?? null })
		.select("id")
		.single();

	if (error) return { data: null, error };

	return { data: { id: (data as { id: string }).id }, error: null };
}

/** Update a category name/slug. */
export async function updateCategory(
	categoryId: string,
	name: string,
	slug: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("part_categories")
		.update({ name, slug })
		.eq("id", categoryId);

	return { error };
}

/** Delete a category. */
export async function deleteCategory(categoryId: string): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("part_categories")
		.delete()
		.eq("id", categoryId);

	return { error };
}

// ============================================================================
// Vehicles
// ============================================================================

/** List all vehicle models. */
export async function listAdminVehicles(): Promise<{ data: AdminVehicle[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("vehicle_models")
		.select("id, make, model, year_start, year_end, body_type, engine")
		.order("make")
		.limit(500);

	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((v) => ({
			id: v.id as string,
			make: v.make as string,
			model: v.model as string,
			yearStart: (v.year_start as number | null) ?? null,
			yearEnd: (v.year_end as number | null) ?? null,
			bodyType: (v.body_type as string | null) ?? null,
			engine: (v.engine as string | null) ?? null,
		})),
		error: null,
	};
}

/** Create a vehicle model. */
export async function createVehicle(vehicle: Omit<AdminVehicle, "id">): Promise<{
	data: { id: string } | null;
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("vehicle_models")
		.insert({
			make: vehicle.make,
			model: vehicle.model,
			year_start: vehicle.yearStart,
			year_end: vehicle.yearEnd,
			body_type: vehicle.bodyType,
			engine: vehicle.engine,
		})
		.select("id")
		.single();

	if (error) return { data: null, error };

	return { data: { id: (data as { id: string }).id }, error: null };
}

/** Delete a vehicle model. */
export async function deleteVehicle(vehicleId: string): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase.from("vehicle_models").delete().eq("id", vehicleId);

	return { error };
}

// ============================================================================
// Knowledge Base
// ============================================================================

/** List all KB documents. */
export async function listKBDocuments(): Promise<{ data: KBDocument[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("kb_documents")
		.select("id, title, source_url, created_at")
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((d) => ({
			id: d.id as string,
			title: d.title as string,
			sourceUrl: (d.source_url as string | null) ?? null,
			createdAt: d.created_at as string,
		})),
		error: null,
	};
}

/** Insert a KB document. Embedding generation happens in the API route. */
export async function createKBDocument(
	title: string,
	sourceUrl: string | null,
	content: string,
	embedding: number[],
): Promise<{ data: { id: string } | null; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("kb_documents")
		.insert({
			title,
			source_url: sourceUrl,
			content,
			embedding,
		})
		.select("id")
		.single();

	if (error) return { data: null, error };

	return { data: { id: (data as { id: string }).id }, error: null };
}

/** Delete a KB document. */
export async function deleteKBDocument(documentId: string): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase.from("kb_documents").delete().eq("id", documentId);

	return { error };
}

// ============================================================================
// Payouts
// ============================================================================

/** List all payouts. */
export async function listAdminPayouts(): Promise<{ data: AdminPayout[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("payouts")
		.select(
			"id, seller_id, period_start, period_end, amount, status, method, created_at, profiles (full_name)",
		)
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((p) => {
			const profile = p.profiles as Record<string, unknown> | null;
			return {
				id: p.id as string,
				sellerId: p.seller_id as string,
				sellerName: (profile?.full_name as string | null) ?? null,
				periodStart: p.period_start as string,
				periodEnd: p.period_end as string,
				amount: p.amount as number,
				status: p.status as string,
				method: (p.method as string | null) ?? null,
				createdAt: p.created_at as string,
			};
		}),
		error: null,
	};
}

/** Mark all pending payouts as processing (batch payout run). */
export async function runPayoutBatch(adminId: string): Promise<{ data: { count: number } | null; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("payouts")
		.update({ status: "processing" })
		.eq("status", "pending")
		.select("id");

	if (error) return { data: null, error };

	const count = (data ?? []).length;

	await supabase.from("admin_actions").insert({
		admin_id: adminId,
		target_type: "payouts",
		target_id: "batch",
		action: "run_payout_batch",
		note: `Processed ${count} payouts`,
	});

	return { data: { count }, error: null };
}

// ============================================================================
// Platform Settings
// ============================================================================

/** List all platform settings. */
export async function listPlatformSettings(): Promise<{ data: PlatformSetting[]; error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("platform_settings")
		.select("key, value, updated_at")
		.order("key");

	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((s) => ({
			key: s.key as string,
			value: s.value as string,
			updatedAt: s.updated_at as string,
		})),
		error: null,
	};
}

/** Upsert a platform setting. */
export async function upsertPlatformSetting(
	key: string,
	value: string,
): Promise<{ error: unknown }> {
	const supabase = createAdminSupabaseClient();

	const { error } = await supabase
		.from("platform_settings")
		.upsert({ key, value, updated_at: new Date().toISOString() })
		.eq("key", key);

	return { error };
}

// ============================================================================
// Admin Actions (activity log)
// ============================================================================

/** Fetch recent admin actions for the activity log. */
export async function listRecentAdminActions(limit = 10): Promise<{
	data: AdminAction[];
	error: unknown;
}> {
	const supabase = createAdminSupabaseClient();

	const { data, error } = await supabase
		.from("admin_actions")
		.select("id, admin_id, target_type, target_id, action, note, created_at")
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) return { data: [], error };

	return {
		data: ((data ?? []) as Array<Record<string, unknown>>).map((a) => ({
			id: a.id as string,
			adminId: a.admin_id as string,
			targetType: a.target_type as string,
			targetId: a.target_id as string,
			action: a.action as string,
			note: (a.note as string | null) ?? null,
			createdAt: a.created_at as string,
		})),
		error: null,
	};
}
