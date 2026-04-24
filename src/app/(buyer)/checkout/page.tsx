// ============================================================================
// Checkout Page — RSC
// ============================================================================
//
// Auth-gated checkout entry point. SSR-fetches cart and saved addresses,
// passes to CheckoutShell. Supports ?seller= query param to pre-filter
// the cart to a single seller group.

import { redirect } from "next/navigation";
import type { SearchParams } from "next/dist/server/request/search-params";

import { getServerSession } from "@/lib/auth/guards";
import { getCartWithItems } from "@/lib/features/cart/services";
import type { CartItem, SellerGroup } from "@/lib/features/cart/types";
import CheckoutShell from "./shell";

export const metadata = { title: "Checkout — ShopSmart" };

type CheckoutPageProps = {
	searchParams: Promise<SearchParams>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/checkout");

	const resolvedParams = await searchParams;
	const sellerFilter = typeof resolvedParams.seller === "string" ? resolvedParams.seller : null;

	const { data: cart, error } = await getCartWithItems(session.userId);
	if (error) throw new Error("Failed to load cart");

	// Redirect to cart if empty
	const items = cart?.items ?? [];
	if (items.length === 0) redirect("/cart");

	// Group by seller for checkout display
	const groups = groupCartBySeller(items);
	const targetGroups = sellerFilter
		? groups.filter((g) => g.sellerId === sellerFilter)
		: groups;

	if (targetGroups.length === 0) redirect("/cart");

	return <CheckoutShell groups={targetGroups} />;
}

// ----------------------------------------------------------------------------
// Shared helper
// ----------------------------------------------------------------------------

function groupCartBySeller(items: CartItem[]): SellerGroup[] {
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
