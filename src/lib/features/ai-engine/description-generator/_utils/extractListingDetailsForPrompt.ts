// ============================================================================
// Description Generator — safe spec summary from listing.details + spec_schema
// ============================================================================
//
// Only keys present in `spec_schema` are included; values are not passed through
// as raw JSON blobs — primitives are formatted, unexpected shapes are skipped.

/**
 * Builds a line-oriented summary of listing details using only keys defined in
 * the category `spec_schema` (same keys as validateDetailsAgainstSchema).
 */
export function extractListingDetailsForPrompt(
	specSchema: Record<string, unknown>,
	details: Record<string, unknown>,
): string {
	const lines: string[] = []
	for (const key of Object.keys(specSchema)) {
		if (!(key in details)) continue
		const v = details[key]
		if (v === undefined || v === null) continue
		if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
			lines.push(`${key}: ${String(v)}`)
		}
	}
	return lines.length > 0 ? lines.join('\n') : 'No spec fields filled yet.'
}
