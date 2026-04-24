// ============================================================================
// Orders — Server Services
// ============================================================================
//
// Business logic for order lifecycle management. Uses admin Supabase client
// for order creation (RLS bypass needed for cross-table writes) and server
// client for user-context reads.
//
// State machine transitions allowed:
//   pending_payment → paid_escrow (payment confirmed)
//   paid_escrow → accepted (seller accepts)
//   accepted → shipped (seller ships)
//   shipped → delivered (courier/system)
//   delivered → completed (buyer confirms receipt)
//   delivered → disputed (buyer raises dispute)
//   completed → refunded (admin)
//   * → cancelled (buyer pre-acceptance, or admin)
//
// Notifications are inserted into `notifications` table on status change.

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { clearCartItems } from "@/lib/features/cart/services";
import { generateOrderNumber } from "@/lib/utils/order-number";

import type { Order, OrderItem, OrderStatus, OrderStatusEvent } from "@/lib/features/orders/types";
import type { PlaceOrderInput, ShipOrderInput } from "@/lib/features/orders/schemas";

// ----------------------------------------------------------------------------
// State machine
// ----------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending_payment: ["paid_escrow", "cancelled"],
	paid_escrow: ["accepted", "cancelled"],
	accepted: ["shipped", "cancelled"],
	shipped: ["delivered"],
	delivered: ["completed", "disputed"],
	completed: ["refunded"],
	disputed: ["refunded", "completed"],
	refunded: [],
	cancelled: [],
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ----------------------------------------------------------------------------
// DB row → domain type mappers
// ----------------------------------------------------------------------------

function mapOrderRow(
	row: Record<string, unknown>,
	items: OrderItem[],
): Order {
	const store = row.seller_stores as Record<string, unknown> | null;

	return {
		id: row.id as string,
		orderNumber: row.order_number as string,
		buyerId: row.buyer_id as string,
		sellerId: row.seller_id as string,
		storeId: (row.store_id as string | null) ?? null,
		ssStatus: row.ss_status as OrderStatus,
		subtotal: row.subtotal as number,
		shippingFee: row.shipping_fee as number,
		platformFee: row.platform_fee as number,
		total: row.total as number,
		shippingAddress: row.shipping_address as Order["shippingAddress"],
		trackingNumber: (row.tracking_number as string | null) ?? null,
		courierName: (row.courier_name as string | null) ?? null,
		paymentMethod: "cod",
		placedAt: row.placed_at as string,
		acceptedAt: (row.accepted_at as string | null) ?? null,
		shippedAt: (row.shipped_at as string | null) ?? null,
		deliveredAt: (row.delivered_at as string | null) ?? null,
		completedAt: (row.completed_at as string | null) ?? null,
		items,
		store: store
			? {
					storeName: store.store_name as string,
					slug: store.slug as string,
				}
			: undefined,
	};
}

function mapOrderItemRow(row: Record<string, unknown>): OrderItem {
	const snap = row.listing_snapshot as Record<string, unknown>;

	return {
		id: row.id as string,
		orderId: row.order_id as string,
		listingId: row.listing_id as string,
		listingSnapshot: {
			title: (snap?.title as string) ?? "Unknown",
			imageUrl: (snap?.imageUrl as string | null) ?? null,
			condition: (snap?.condition as string | null) ?? null,
		},
		qty: row.qty as number,
		unitPrice: row.unit_price as number,
		lineTotal: row.line_total as number,
	};
}

// ----------------------------------------------------------------------------
// Notification helper
// ----------------------------------------------------------------------------

async function sendNotification(
	supabase: ReturnType<typeof createAdminSupabaseClient>,
	params: {
		userId: string;
		type: string;
		title: string;
		body: string;
		entityType?: string;
		entityId?: string;
	},
) {
	await supabase.from("notifications").insert({
		user_id: params.userId,
		type: params.type,
		title: params.title,
		body: params.body,
		entity_type: params.entityType ?? null,
		entity_id: params.entityId ?? null,
	});
}

// ----------------------------------------------------------------------------
// Exported service functions
// ----------------------------------------------------------------------------

/**
 * Place an order for a seller group from the buyer's cart.
 * Creates: order row, order_items rows, escrow_transaction (held).
 * Clears the relevant cart items. Notifies both parties.
 */
export async function placeOrder(
	buyerId: string,
	payload: PlaceOrderInput,
): Promise<{ data: { orderId: string; orderNumber: string } | null; error: unknown }> {
	const admin = createAdminSupabaseClient();

	// 1 — Resolve shipping address
	let shippingAddress = payload.shippingAddress;
	if (!shippingAddress && payload.shippingAddressId) {
		const { data: savedAddr } = await admin
			.from("addresses")
			.select("*")
			.eq("id", payload.shippingAddressId)
			.eq("user_id", buyerId)
			.maybeSingle();

		if (savedAddr) {
			const addr = savedAddr as Record<string, unknown>;
			shippingAddress = {
				fullName: addr.full_name as string,
				phone: addr.phone as string,
				addressLine: addr.address_line as string,
				city: addr.city as string,
				province: addr.province as string,
			};
		}
	}

	if (!shippingAddress) {
		return { data: null, error: new Error("Shipping address is required") };
	}

	// 2 — Get cart items for this seller
	const { data: cartRow } = await admin
		.from("carts")
		.select("id")
		.eq("user_id", buyerId)
		.maybeSingle();

	if (!cartRow) return { data: null, error: new Error("Cart not found") };

	const cartId = (cartRow as Record<string, unknown>).id as string;

	const { data: cartItems, error: cartItemsError } = await admin
		.from("cart_items")
		.select(
			`
			id,
			listing_id,
			qty,
			snapshot_price,
			listings (
				id,
				title,
				user_id,
				status,
				stock,
				condition,
				primary_image_url,
				seller_stores (
					id,
					store_name,
					slug
				)
			)
		`,
		)
		.eq("cart_id", cartId);

	if (cartItemsError) return { data: null, error: cartItemsError };

	// Filter to the target seller
	const sellerItems = (cartItems ?? []).filter((item) => {
		const listing = (item.listings as unknown) as Record<string, unknown> | null;
		return listing?.user_id === payload.cartGroupSellerId;
	});

	if (sellerItems.length === 0) {
		return { data: null, error: new Error("No cart items found for this seller") };
	}

	// 3 — Validate all listings are active
	for (const item of sellerItems) {
		const listing = (item.listings as unknown) as Record<string, unknown> | null;
		if (!listing || listing.status !== "active") {
			return {
				data: null,
				error: new Error(`Listing "${(listing?.title as string) ?? item.listing_id}" is no longer available`),
			};
		}
	}

	// 4 — Calculate totals
	const subtotal = sellerItems.reduce(
		(sum, item) => sum + (item.snapshot_price as number) * (item.qty as number),
		0,
	);
	const shippingFee = 250; // fixed flat rate
	const platformFee = Math.round(subtotal * 0.03); // 3%
	const total = subtotal + shippingFee + platformFee;

	// 5 — Generate order number using a sequence approach
	const { count } = await admin
		.from("orders")
		.select("*", { count: "exact", head: true });

	const orderNumber = generateOrderNumber((count ?? 0) + 1);

	// 6 — Get store info from the first item
	const firstListing = (sellerItems[0]!.listings as unknown) as Record<string, unknown>;
	const storeProfiles = firstListing?.seller_stores as Record<string, unknown> | null;
	const storeId = storeProfiles?.id as string | null;

	// 7 — Insert order
	const { data: orderRow, error: orderError } = await admin
		.from("orders")
		.insert({
			order_number: orderNumber,
			buyer_id: buyerId,
			seller_id: payload.cartGroupSellerId,
			store_id: storeId,
			ss_status: "pending_payment",
			subtotal,
			shipping_fee: shippingFee,
			platform_fee: platformFee,
			total,
			shipping_address: shippingAddress,
			placed_at: new Date().toISOString(),
		})
		.select("id")
		.single();

	if (orderError) return { data: null, error: orderError };

	const orderId = ((orderRow as Record<string, unknown>).id) as string;

	// 8 — Insert order items
	const orderItems = sellerItems.map((item) => {
		const listing = (item.listings as unknown) as Record<string, unknown>;
		const unitPrice = item.snapshot_price as number;
		const qty = item.qty as number;

		return {
			order_id: orderId,
			listing_id: item.listing_id as string,
			listing_snapshot: {
				title: listing.title as string,
				imageUrl: (listing.primary_image_url as string | null) ?? null,
				condition: (listing.condition as string | null) ?? null,
			},
			qty,
			unit_price: unitPrice,
			line_total: unitPrice * qty,
		};
	});

	const { error: itemsError } = await admin.from("order_items").insert(orderItems);
	if (itemsError) return { data: null, error: itemsError };

	// 9 — Record initial status event
	await admin.from("order_status_events").insert({
		order_id: orderId,
		from_status: null,
		to_status: "pending_payment",
		actor_id: buyerId,
		note: "Order placed",
	});

	// 10 — For COD: auto-transition to paid_escrow
	if (payload.paymentMethod === "cod") {
		await admin
			.from("orders")
			.update({ ss_status: "paid_escrow" })
			.eq("id", orderId);

		await admin.from("order_status_events").insert({
			order_id: orderId,
			from_status: "pending_payment",
			to_status: "paid_escrow",
			actor_id: buyerId,
			note: "COD — payment confirmed on delivery",
		});
	}

	// 11 — Create escrow transaction
	await admin.from("escrow_transactions").insert({
		order_id: orderId,
		amount: total,
		status: "held",
		buyer_id: buyerId,
		seller_id: payload.cartGroupSellerId,
	});

	// 12 — Clear cart items for this seller
	const listingIds = sellerItems.map((item) => item.listing_id as string);
	await clearCartItems(buyerId, listingIds);

	// 13 — Notify seller
	await sendNotification(admin, {
		userId: payload.cartGroupSellerId,
		type: "order_status",
		title: `New order ${orderNumber}`,
		body: `You have a new order for ${sellerItems.length} item${sellerItems.length !== 1 ? "s" : ""}`,
		entityType: "order",
		entityId: orderId,
	});

	return { data: { orderId, orderNumber }, error: null };
}

/** Fetch all orders for a buyer, optionally filtered by status. */
export async function getOrdersForBuyer(
	buyerId: string,
	status?: OrderStatus,
): Promise<{ data: Order[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	let q = supabase
		.from("orders")
		.select(
			`
			id, order_number, buyer_id, seller_id, store_id,
			ss_status, subtotal, shipping_fee, platform_fee, total,
			shipping_address, tracking_number, courier_name,
			placed_at, accepted_at, shipped_at, delivered_at, completed_at,
			seller_stores (store_name, slug)
		`,
		)
		.eq("buyer_id", buyerId)
		.order("placed_at", { ascending: false });

	if (status) q = q.eq("ss_status", status);

	const { data: rows, error } = await q;
	if (error) return { data: [], error };

	const orders: Order[] = [];

	for (const row of rows ?? []) {
		const r = row as Record<string, unknown>;

		const { data: itemRows } = await supabase
			.from("order_items")
			.select("id, order_id, listing_id, listing_snapshot, qty, unit_price, line_total")
			.eq("order_id", r.id as string);

		const items = (itemRows ?? []).map((ir) =>
			mapOrderItemRow(ir as Record<string, unknown>),
		);

		orders.push(mapOrderRow(r, items));
	}

	return { data: orders, error: null };
}

/** Fetch all orders for a seller, optionally filtered by status. */
export async function getOrdersForSeller(
	sellerId: string,
	status?: OrderStatus,
): Promise<{ data: Order[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	let q = supabase
		.from("orders")
		.select(
			`
			id, order_number, buyer_id, seller_id, store_id,
			ss_status, subtotal, shipping_fee, platform_fee, total,
			shipping_address, tracking_number, courier_name,
			placed_at, accepted_at, shipped_at, delivered_at, completed_at,
			seller_stores (store_name, slug)
		`,
		)
		.eq("seller_id", sellerId)
		.order("placed_at", { ascending: false });

	if (status) q = q.eq("ss_status", status);

	const { data: rows, error } = await q;
	if (error) return { data: [], error };

	const orders: Order[] = [];

	for (const row of rows ?? []) {
		const r = row as Record<string, unknown>;

		const { data: itemRows } = await supabase
			.from("order_items")
			.select("id, order_id, listing_id, listing_snapshot, qty, unit_price, line_total")
			.eq("order_id", r.id as string);

		const items = (itemRows ?? []).map((ir) =>
			mapOrderItemRow(ir as Record<string, unknown>),
		);

		orders.push(mapOrderRow(r, items));
	}

	return { data: orders, error: null };
}

/**
 * Fetch a single order with full detail.
 * viewerId can be the buyer or the seller — both are allowed.
 */
export async function getOrderDetail(
	orderId: string,
	viewerId: string,
): Promise<{ data: Order | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data: row, error } = await supabase
		.from("orders")
		.select(
			`
			id, order_number, buyer_id, seller_id, store_id,
			ss_status, subtotal, shipping_fee, platform_fee, total,
			shipping_address, tracking_number, courier_name,
			placed_at, accepted_at, shipped_at, delivered_at, completed_at,
			seller_stores (store_name, slug)
		`,
		)
		.eq("id", orderId)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!row) return { data: null, error: null };

	const r = row as Record<string, unknown>;

	// Viewer must be buyer or seller
	if (r.buyer_id !== viewerId && r.seller_id !== viewerId) {
		return { data: null, error: new Error("Forbidden") };
	}

	const { data: itemRows, error: itemsError } = await supabase
		.from("order_items")
		.select("id, order_id, listing_id, listing_snapshot, qty, unit_price, line_total")
		.eq("order_id", orderId);

	if (itemsError) return { data: null, error: itemsError };

	const items = (itemRows ?? []).map((ir) =>
		mapOrderItemRow(ir as Record<string, unknown>),
	);

	return { data: mapOrderRow(r, items), error: null };
}

/**
 * Transition an order's status through the defined state machine.
 * Records a status event and updates relevant timestamps.
 * Sends notifications to the affected party.
 */
export async function transitionOrderStatus(
	orderId: string,
	actorId: string,
	toStatus: OrderStatus,
	note?: string,
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	const { data: row, error: fetchError } = await admin
		.from("orders")
		.select("id, order_number, ss_status, buyer_id, seller_id")
		.eq("id", orderId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!row) return { error: new Error("Order not found") };

	const r = row as Record<string, unknown>;
	const fromStatus = r.ss_status as OrderStatus;

	if (!canTransition(fromStatus, toStatus)) {
		return {
			error: new Error(`Cannot transition from ${fromStatus} to ${toStatus}`),
		};
	}

	// Timestamp fields
	const timestampPatch: Record<string, string> = {};
	if (toStatus === "accepted") timestampPatch.accepted_at = new Date().toISOString();
	if (toStatus === "shipped") timestampPatch.shipped_at = new Date().toISOString();
	if (toStatus === "delivered") timestampPatch.delivered_at = new Date().toISOString();
	if (toStatus === "completed") timestampPatch.completed_at = new Date().toISOString();

	const { error: updateError } = await admin
		.from("orders")
		.update({ ss_status: toStatus, ...timestampPatch })
		.eq("id", orderId);

	if (updateError) return { error: updateError };

	// Record event
	await admin.from("order_status_events").insert({
		order_id: orderId,
		from_status: fromStatus,
		to_status: toStatus,
		actor_id: actorId,
		note: note ?? null,
	});

	// Notify the other party
	const orderNumber = r.order_number as string;
	const buyerId = r.buyer_id as string;
	const sellerId = r.seller_id as string;
	const recipientId = actorId === buyerId ? sellerId : buyerId;

	await sendNotification(admin, {
		userId: recipientId,
		type: "order_status",
		title: `Order ${orderNumber} update`,
		body: `Your order is now ${toStatus.replace(/_/g, " ")}`,
		entityType: "order",
		entityId: orderId,
	});

	return { error: null };
}

/**
 * Buyer confirms receipt — transitions to completed + queues escrow release.
 */
export async function confirmReceipt(
	buyerId: string,
	orderId: string,
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	const { data: row, error: fetchError } = await admin
		.from("orders")
		.select("id, ss_status, buyer_id")
		.eq("id", orderId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!row) return { error: new Error("Order not found") };

	const r = row as Record<string, unknown>;

	if (r.buyer_id !== buyerId) return { error: new Error("Forbidden") };
	if (r.ss_status !== "delivered") {
		return { error: new Error("Order must be in delivered status to confirm receipt") };
	}

	const { error } = await transitionOrderStatus(orderId, buyerId, "completed", "Buyer confirmed receipt");
	if (error) return { error };

	// Release escrow
	await admin
		.from("escrow_transactions")
		.update({ status: "released", released_at: new Date().toISOString() })
		.eq("order_id", orderId);

	return { error: null };
}

/**
 * Fetch status events for realtime tracking timeline.
 */
export async function getOrderStatusEvents(
	orderId: string,
	viewerId: string,
): Promise<{ data: OrderStatusEvent[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify access
	const { data: orderRow } = await supabase
		.from("orders")
		.select("buyer_id, seller_id")
		.eq("id", orderId)
		.maybeSingle();

	if (!orderRow) return { data: [], error: new Error("Order not found") };

	const r = orderRow as Record<string, unknown>;
	if (r.buyer_id !== viewerId && r.seller_id !== viewerId) {
		return { data: [], error: new Error("Forbidden") };
	}

	const { data: rows, error } = await supabase
		.from("order_status_events")
		.select("id, order_id, from_status, to_status, actor_id, note, created_at")
		.eq("order_id", orderId)
		.order("created_at", { ascending: true });

	if (error) return { data: [], error };

	const events = (rows ?? []).map((row) => {
		const r = row as Record<string, unknown>;

		return {
			id: r.id as string,
			orderId: r.order_id as string,
			fromStatus: (r.from_status as OrderStatus | null) ?? null,
			toStatus: r.to_status as OrderStatus,
			actorId: r.actor_id as string,
			note: (r.note as string | null) ?? null,
			createdAt: r.created_at as string,
		} satisfies OrderStatusEvent;
	});

	return { data: events, error: null };
}
