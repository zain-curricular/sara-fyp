// ============================================================================
// Disputes — Types
// ============================================================================
//
// Domain types for the disputes feature.
// Disputes are raised by buyers against orders and resolved by admins.

export type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

export type DisputeReason =
	| "item_not_received"
	| "item_not_as_described"
	| "damaged_item"
	| "wrong_item"
	| "seller_unresponsive"
	| "other";

export type Dispute = {
	id: string;
	orderId: string;
	openedBy: string;
	reason: DisputeReason;
	description: string;
	evidenceUrls: string[];
	status: DisputeStatus;
	resolutionNote: string | null;
	resolvedBy: string | null;
	createdAt: string;
	resolvedAt: string | null;
	sellerReply: string | null;
	sellerRepliedAt: string | null;

	// Joined order summary (populated when fetching detail)
	order?: {
		orderNumber: string;
		buyerId: string;
		sellerId: string;
		total: number;
	};
};
