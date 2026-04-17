// ============================================================================
// Listings — validate `details` JSONB against category.spec_schema
// ============================================================================
//
// spec_schema maps field keys to primitive type names: "string" | "number" |
// "boolean". Produces a strict Zod object; extra keys in `details` fail.

import { z } from 'zod'

export type DetailsValidationResult =
	| { ok: true; data: Record<string, unknown> }
	| { ok: false; errors: string[] }

function fieldSchemaFromHint(hint: unknown): z.ZodTypeAny {
	if (hint === 'number') {
		return z.number()
	}
	if (hint === 'boolean') {
		return z.boolean()
	}
	return z.string()
}

/**
 * Builds a strict Zod object from `categories.spec_schema` and parses `details`.
 *
 * @param specSchema - Category `spec_schema` JSON (field → type hint).
 * @param details - Submitted listing.details object.
 */
export function validateDetailsAgainstSchema(
	specSchema: Record<string, unknown>,
	details: unknown,
): DetailsValidationResult {
	const shape: Record<string, z.ZodTypeAny> = {}
	for (const [key, hint] of Object.entries(specSchema)) {
		shape[key] = fieldSchemaFromHint(hint)
	}
	const schema = z.object(shape).strict()
	const parsed = schema.safeParse(details)
	if (!parsed.success) {
		return {
			ok: false,
			errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
		}
	}
	return { ok: true, data: parsed.data as Record<string, unknown> }
}
