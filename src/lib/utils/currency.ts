// ============================================================================
// Currency Formatting — PKR
// ============================================================================

const PKR_FORMATTER = new Intl.NumberFormat("en-PK", {
	style: "currency",
	currency: "PKR",
	maximumFractionDigits: 0,
});

/** Format a number as PKR currency string (e.g. "PKR 12,500"). */
export function formatPKR(amount: number): string {
	return PKR_FORMATTER.format(amount);
}

/** Compact format for large numbers (e.g. "PKR 1.2M"). */
export function formatPKRCompact(amount: number): string {
	if (amount >= 1_000_000) {
		return `PKR ${(amount / 1_000_000).toFixed(1)}M`;
	}
	if (amount >= 1_000) {
		return `PKR ${(amount / 1_000).toFixed(0)}K`;
	}
	return formatPKR(amount);
}
