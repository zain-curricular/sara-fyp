// ============================================================================
// Payment gateway — stub checkout URL (real providers plug in here)
// ============================================================================

/**
 * Returns a client-redirect URL for completing payment (placeholder until
 * JazzCash / EasyPaisa / Stripe SDKs are wired).
 */
export function buildOrderCheckoutRedirectUrl(orderId: string, escrowTransactionId: string): string {
	const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
	const path = `/checkout/order?order_id=${encodeURIComponent(orderId)}&escrow_id=${encodeURIComponent(escrowTransactionId)}`
	if (!base) {
		return path
	}
	return `${base.replace(/\/$/, '')}${path}`
}
