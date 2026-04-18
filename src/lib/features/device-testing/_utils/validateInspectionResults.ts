// ============================================================================
// Device testing — validate inspection_results vs categories.inspection_schema
// ============================================================================
//
// inspection_schema shape: { [criterion: string]: { [field: string]: typeHint } }
// Type hints: "string" | "number" | "boolean" | "string[]" (optional photo_urls).

import { z } from 'zod'

export type InspectionValidationResult =
	| { ok: true; data: Record<string, unknown> }
	| { ok: false; errors: string[] }

function fieldSchemaFromHint(hint: unknown): z.ZodTypeAny {
	if (hint === 'number') {
		return z.number()
	}
	if (hint === 'boolean') {
		return z.boolean()
	}
	if (hint === 'string[]') {
		return z.array(z.string())
	}
	return z.string()
}

/**
 * Validates one criterion object against its sub-schema (strict keys).
 */
function criterionObjectSchema(subSchema: Record<string, unknown>): z.ZodObject<Record<string, z.ZodTypeAny>> {
	const shape: Record<string, z.ZodTypeAny> = {}
	for (const [key, hint] of Object.entries(subSchema)) {
		shape[key] = fieldSchemaFromHint(hint)
	}
	if (!('photo_urls' in shape)) {
		shape.photo_urls = z.array(z.string()).optional()
	}
	return z.object(shape).strict()
}

/**
 * Validates `inspection_results` against `categories.inspection_schema`.
 */
export function validateInspectionResultsAgainstSchema(
	inspectionSchema: Record<string, unknown>,
	results: unknown,
): InspectionValidationResult {
	const top = z.record(z.string(), z.unknown()).safeParse(results)
	if (!top.success) {
		return { ok: false, errors: ['inspection_results must be an object'] }
	}

	const parsedRoot: Record<string, unknown> = {}
	const errors: string[] = []

	for (const [criterion, subSchemaUnknown] of Object.entries(inspectionSchema)) {
		const subSchema = subSchemaUnknown
		if (typeof subSchema !== 'object' || subSchema === null || Array.isArray(subSchema)) {
			errors.push(`Invalid inspection_schema for criterion "${criterion}"`)
			continue
		}
		const criterionSchema = criterionObjectSchema(subSchema as Record<string, unknown>)
		const value = top.data[criterion]
		const r = criterionSchema.safeParse(value)
		if (!r.success) {
			errors.push(
				...r.error.issues.map((i) => `${criterion}.${i.path.join('.')}: ${i.message}`),
			)
		} else {
			parsedRoot[criterion] = r.data
		}
	}

	// Reject unknown top-level keys (strict)
	for (const key of Object.keys(top.data)) {
		if (!(key in inspectionSchema)) {
			errors.push(`Unknown criterion "${key}"`)
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors }
	}
	return { ok: true, data: parsedRoot }
}
