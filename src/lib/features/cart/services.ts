// ============================================================================
// Cart — Server Services
// ============================================================================
//
// Server-only functions for cart management. Uses the server Supabase client
// (RLS applies) for user-context queries. All functions return { data, error }
// and never throw — callers decide how to handle errors.
//
// Cart table: carts (id, user_id, created_at, updated_at)
// Items table: cart_items (id, cart_id, listing_id, qty, snapshot_price, added_at)
// Join with: listings, store_profiles

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import type { Cart, CartItem, CartSummary, SellerGroup } from "@/lib/features/cart/types";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function buildCartItem(row: Record<string, unknown>): CartItem {
	const listing = row.listings as Record<string, unknown> | null;
	const store = listing
		? (listing.store_profiles as Record<string, unknown> | null)
		: null;

	return {
		id: row.id as string,
		cartId: row.cart_id as string,
		listingId: row.listing_id as string,
		qty: row.qty as number,
		snapshotPrice: row.snapshot_price as number,
		addedAt: row.added_at as string,
		listing: listing
			? {
					id: listing.id as string,
					title: listing.title as string,
					sellerId: listing.user_id as string,
					storeName: (store?.store_name as string) ?? "Unknown Store",
					storeSlug: (store?.slug as string) ?? "",
					imageUrl: (listing.primary_image_url as string | null) ?? null,
					status: listing.status as string,
					stock: (listing.stock as number | null) ?? null,
				}
			: undefined,
	};
}

function groupItemsBySeller(items: CartItem[]): SellerGroup[] {
	const map = new Map<string, SellerGroup>();

	for (const item of items) {
		if (!item.listing) continue;

		const { sellerId, storeName, storeSlug } = item.listing;
		const existing = map.get(sellerId);

		if (existing) {
			existing.items.push(item);
			existing.subtotal += item.snapshotPrice * item.qty;
		} else {
			map.set(sellerId, {
				sellerId,
				storeName,
				storeSlug,
				items: [item],
				subtotal: item.snapshotPrice * item.qty,
			});
		}
	}

	return Array.from(map.values());
}

// ----------------------------------------------------------------------------
// Exported service functions
// ----------------------------------------------------------------------------

/** Get or create a cart for the user. Returns the cart row (without items). */
export async function getOrCreateCart(
	userId: string,
): Promise<{ data: Cart | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data: existing, error: fetchError } = await supabase
		.from("carts")
		.select("id, user_id, created_at, updated_at")
		.eq("user_id", userId)
		.maybeSingle();

	if (fetchError) return { data: null, error: fetchError };

	if (existing) {
		return {
			data: {
				id: existing.id as string,
				userId: existing.user_id as string,
				items: [],
				createdAt: existing.created_at as string,
				updatedAt: existing.updated_at as string,
			},
			error: null,
		};
	}

	// Create new cart
	const { data: created, error: createError } = await supabase
		.from("carts")
		.insert({ user_id: userId })
		.select("id, user_id, created_at, updated_at")
		.single();

	if (createError) return { data: null, error: createError };

	return {
		data: {
			id: (created as Record<string, unknown>).id as string,
			userId: (created as Record<string, unknown>).user_id as string,
			items: [],
			createdAt: (created as Record<string, unknown>).created_at as string,
			updatedAt: (created as Record<string, unknown>).updated_at as string,
		},
		error: null,
	};
}

/**
 * Add or upsert a listing to the user's cart.
 * Validates listing is active and has sufficient stock.
 */
export async function addToCart(
	userId: string,
	listingId: string,
	qty: number,
): Promise<{ data: CartItem | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Validate listing
	const { data: listing, error: listingError } = await supabase
		.from("listings")
		.select("id, price, status, stock")
		.eq("id", listingId)
		.maybeSingle();

	if (listingError) return { data: null, error: listingError };
	if (!listing) return { data: null, error: new Error("Listing not found") };

	const listingRow = listing as Record<string, unknown>;

	if (listingRow.status !== "active") {
		return { data: null, error: new Error("Listing is not active") };
	}

	if (listingRow.stock !== null && (listingRow.stock as number) < qty) {
		return { data: null, error: new Error("Insufficient stock") };
	}

	// Ensure cart exists
	const { data: cart, error: cartError } = await getOrCreateCart(userId);
	if (cartError || !cart) return { data: null, error: cartError ?? new Error("Failed to get cart") };

	// Upsert item
	const { data: item, error: itemError } = await supabase
		.from("cart_items")
		.upsert(
			{
				cart_id: cart.id,
				listing_id: listingId,
				qty,
				snapshot_price: listingRow.price as number,
			},
			{ onConflict: "cart_id,listing_id" },
		)
		.select("id, cart_id, listing_id, qty, snapshot_price, added_at")
		.single();

	if (itemError) return { data: null, error: itemError };

	const row = item as Record<string, unknown>;

	return {
		data: {
			id: row.id as string,
			cartId: row.cart_id as string,
			listingId: row.listing_id as string,
			qty: row.qty as number,
			snapshotPrice: row.snapshot_price as number,
			addedAt: row.added_at as string,
		},
		error: null,
	};
}

/** Update the qty of a cart item. Validates the item belongs to the user. */
export async function updateCartItem(
	userId: string,
	cartItemId: string,
	qty: number,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify ownership via join
	const { data: existing, error: fetchError } = await supabase
		.from("cart_items")
		.select("id, cart_id, carts!inner(user_id)")
		.eq("id", cartItemId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!existing) return { error: new Error("Cart item not found") };

	const row = existing as Record<string, unknown>;
	const cart = (row.carts as Record<string, unknown>) ?? {};

	if (cart.user_id !== userId) return { error: new Error("Forbidden") };

	const { error } = await supabase
		.from("cart_items")
		.update({ qty })
		.eq("id", cartItemId);

	return { error };
}

/** Remove a cart item. Validates the item belongs to the user. */
export async function removeCartItem(
	userId: string,
	cartItemId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify ownership
	const { data: existing, error: fetchError } = await supabase
		.from("cart_items")
		.select("id, carts!inner(user_id)")
		.eq("id", cartItemId)
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!existing) return { error: new Error("Cart item not found") };

	const row = existing as Record<string, unknown>;
	const cart = (row.carts as Record<string, unknown>) ?? {};

	if (cart.user_id !== userId) return { error: new Error("Forbidden") };

	const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

	return { error };
}

/**
 * Fetch cart with all items joined to listing + store data.
 * Returns a Cart with full CartItem[] (including listing details).
 */
export async function getCartWithItems(
	userId: string,
): Promise<{ data: Cart | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Get or create cart first
	const { data: cart, error: cartError } = await getOrCreateCart(userId);
	if (cartError || !cart) return { data: null, error: cartError ?? new Error("Failed to get cart") };

	const { data: rawItems, error: itemsError } = await supabase
		.from("cart_items")
		.select(
			`
			id,
			cart_id,
			listing_id,
			qty,
			snapshot_price,
			added_at,
			listings (
				id,
				title,
				user_id,
				status,
				stock,
				primary_image_url,
				store_profiles (
					store_name,
					slug
				)
			)
		`,
		)
		.eq("cart_id", cart.id)
		.order("added_at", { ascending: true });

	if (itemsError) return { data: null, error: itemsError };

	const items = (rawItems ?? []).map((r) =>
		buildCartItem(r as unknown as Record<string, unknown>),
	);

	return {
		data: {
			id: cart.id,
			userId: cart.userId,
			items,
			createdAt: cart.createdAt,
			updatedAt: cart.updatedAt,
		},
		error: null,
	};
}

/**
 * Summarise a cart into item count and seller groups.
 * Useful for the cart icon badge and checkout grouping.
 */
export async function getCartSummary(
	userId: string,
): Promise<{ data: CartSummary | null; error: unknown }> {
	const { data: cart, error } = await getCartWithItems(userId);
	if (error || !cart) return { data: null, error };

	const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0);
	const groupsBySeller = groupItemsBySeller(cart.items);

	return { data: { itemCount, groupsBySeller }, error: null };
}

/**
 * Remove specific listing IDs from the cart after order placement.
 * Uses admin client to bypass RLS in order-creation flow.
 */
export async function clearCartItems(
	userId: string,
	listingIds: string[],
): Promise<{ error: unknown }> {
	if (listingIds.length === 0) return { error: null };

	const admin = createAdminSupabaseClient();

	// Resolve cart id
	const { data: cart, error: cartError } = await admin
		.from("carts")
		.select("id")
		.eq("user_id", userId)
		.maybeSingle();

	if (cartError) return { error: cartError };
	if (!cart) return { error: null };

	const { error } = await admin
		.from("cart_items")
		.delete()
		.eq("cart_id", (cart as Record<string, unknown>).id)
		.in("listing_id", listingIds);

	return { error };
}
