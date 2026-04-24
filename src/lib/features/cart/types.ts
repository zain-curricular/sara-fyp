// ============================================================================
// Cart — Types
// ============================================================================
//
// Domain types for the cart feature. CartItem snapshots the listing price at
// add-time. Cart groups items by seller for multi-seller checkout flows.
// SellerGroup drives per-seller order creation.

export type CartItem = {
	id: string;
	cartId: string;
	listingId: string;
	qty: number;
	snapshotPrice: number;
	addedAt: string;

	// Joined listing data — present when fetched via getCartWithItems
	listing?: {
		id: string;
		title: string;
		sellerId: string;
		storeName: string;
		storeSlug: string;
		imageUrl: string | null;
		status: string;
		stock: number | null;
	};
};

export type Cart = {
	id: string;
	userId: string;
	items: CartItem[];
	createdAt: string;
	updatedAt: string;
};

export type SellerGroup = {
	sellerId: string;
	storeName: string;
	storeSlug: string;
	items: CartItem[];
	subtotal: number;
};

export type CartSummary = {
	itemCount: number;
	groupsBySeller: SellerGroup[];
};
