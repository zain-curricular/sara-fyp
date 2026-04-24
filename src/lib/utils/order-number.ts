// ============================================================================
// Order Number Generator
// ============================================================================

/** Generate a human-readable order number: SS-2026-000123 */
export function generateOrderNumber(seq: number): string {
	const year = new Date().getFullYear();
	const padded = String(seq).padStart(6, "0");
	return `SS-${year}-${padded}`;
}
