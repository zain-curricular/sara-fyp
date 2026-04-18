// ============================================================================
// Shared `orders` select list (device testing + orders feature alignment)
// ============================================================================

export const orderCols =
	'id, listing_id, buyer_id, seller_id, assigned_tester_id, amount, status, shipping_tracking_to_center, shipping_tracking_to_buyer, paid_at, shipped_to_center_at, received_at_center_at, testing_completed_at, approved_at, rejected_at, shipped_to_buyer_at, delivered_at, completed_at, cancelled_at, created_at, updated_at' as const
