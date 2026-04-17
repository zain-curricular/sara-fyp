// ============================================================================
// Zod body validation helper for API routes
// ============================================================================
//
// Parses JSON bodies with a Zod schema and returns either parsed data or a
// ready-to-return 400 NextResponse. Keeps routes thin (validate → delegate).

import { NextResponse } from 'next/server'
import type { z } from 'zod'

/** Discriminated result: valid data or a 400 Response from Zod issues. */
export type ValidationResult<T> =
	| { data: T; error: null }
	| { data: null; error: NextResponse }

/**
 * Parses `body` with the given Zod schema; on failure returns a 400 envelope.
 *
 * @param body - Typically `await request.json()` (unknown shape).
 * @param schema - Zod schema for the expected body type.
 * @returns Parsed data or a NextResponse with joined issue messages.
 */
export function validateRequestBody<T>(body: unknown, schema: z.ZodType<T>): ValidationResult<T> {
	const parsed = schema.safeParse(body)
	if (!parsed.success) {
		// Surface first-line friendly messages from Zod; never leak internals
		const msg = parsed.error.issues.map((i) => i.message).join('; ')
		return {
			data: null,
			error: NextResponse.json({ ok: false, error: msg }, { status: 400 }),
		}
	}
	return { data: parsed.data, error: null }
}

/**
 * Narrowing helper for `validateRequestBody` results in route handlers.
 *
 * @param r - Result from validateRequestBody.
 */
export function isValidationError<T>(
	r: ValidationResult<T>,
): r is { data: null; error: NextResponse } {
	return r.error !== null
}
