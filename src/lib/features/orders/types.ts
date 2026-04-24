// ============================================================================
// Orders — Types
// ============================================================================
//
// Domain types for the orders feature. OrderStatus mirrors the state machine
// defined in the DB. ShippingAddress is stored as JSONB on the orders row.
// OrderItem snapshots listing data at order time.

export type OrderStatus =
	| "pending_payment"
	| "paid_escrow"
	| "accepted"
	| "shipped"
	| "delivered"
	| "completed"
	| "disputed"
	| "refunded"
	| "cancelled";

export type ShippingAddress = {
	fullName: string;
	phone: string;
	addressLine: string;
	city: string;
	province: string;
};

export type OrderItem = {
	id: string;
	orderId: string;
	listingId: string;
	listingSnapshot: {
		title: string;
		imageUrl: string | null;
		condition: string | null;
	};
	qty: number;
	unitPrice: number;
	lineTotal: number;
};

export type Order = {
	id: string;
	orderNumber: string;
	buyerId: string;
	sellerId: string;
	storeId: string | null;
	ssStatus: OrderStatus;
	subtotal: number;
	shippingFee: number;
	platformFee: number;
	total: number;
	shippingAddress: ShippingAddress;
	trackingNumber: string | null;
	courierName: string | null;
	paymentMethod: string;
	placedAt: string;
	acceptedAt: string | null;
	shippedAt: string | null;
	deliveredAt: string | null;
	completedAt: string | null;
	items: OrderItem[];
	store?: {
		storeName: string;
		slug: string;
	};
};

export type OrderStatusEvent = {
	id: string;
	orderId: string;
	fromStatus: OrderStatus | null;
	toStatus: OrderStatus;
	actorId: string;
	note: string | null;
	createdAt: string;
};
