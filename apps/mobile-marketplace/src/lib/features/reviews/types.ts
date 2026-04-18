/** Mirrors `reviews` row from the marketplace API. */
export type ReviewRecord = {
	id: string;
	reviewer_id: string;
	reviewed_user_id: string;
	order_id: string;
	listing_id: string;
	rating: number;
	comment: string | null;
	created_at: string;
};

export type OrderStatus =
	| "awaiting_payment"
	| "payment_received"
	| "shipped_to_center"
	| "under_testing"
	| "testing_complete"
	| "approved"
	| "rejected"
	| "shipped_to_buyer"
	| "delivered"
	| "completed"
	| "cancelled"
	| "refunded";

/** Subset of GET /api/orders/[id] payload needed for the review flow. */
export type OrderRowSummary = {
	id: string;
	listing_id: string;
	buyer_id: string;
	seller_id: string;
	status: OrderStatus;
	amount: number;
};

export type OrderDetailForReview = {
	order: OrderRowSummary;
};

/** Outcome of {@link fetchOrderDetailForReview} for the buyer review RSC. */
export type FetchOrderDetailForReviewResult =
	| { ok: true; data: OrderDetailForReview }
	| { ok: false; reason: "no_session" | "not_found" | "forbidden" };

export type ReviewsListPayload = {
	items: ReviewRecord[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
};
