import type { CatalogVariant } from "@/lib/features/product-catalog/types";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractVariantsFromSpecs(specs: Record<string, unknown>): CatalogVariant[] {
	// Convention: if specs.variants is an array of { key, value }, prefer it.
	const rawVariants = specs.variants;
	if (Array.isArray(rawVariants)) {
		const normalized = rawVariants
			.map((entry) => {
				if (!isRecord(entry)) return null;
				const key = typeof entry.key === "string" ? entry.key : null;
				const value = typeof entry.value === "string" ? entry.value : null;
				if (!key || !value) return null;
				return { key, value } satisfies CatalogVariant;
			})
			.filter((v): v is CatalogVariant => Boolean(v));

		if (normalized.length) return normalized;
	}

	// Fallback: if specs has option-like arrays, expose them as variants.
	const candidates: Array<[string, unknown]> = Object.entries(specs).filter(([key, value]) => {
		if (key === "variants") return false;
		return Array.isArray(value) && value.every((v) => typeof v === "string");
	});

	if (!candidates.length) return [];

	const variants: CatalogVariant[] = [];
	for (const [key, value] of candidates) {
		for (const entry of value as string[]) {
			variants.push({ key, value: entry });
		}
	}
	return variants;
}
