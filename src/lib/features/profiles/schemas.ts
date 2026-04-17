// ============================================================================
// Profiles — Zod request/response schemas
// ============================================================================
//
// Strict schemas for PATCH bodies: own-profile updates reject admin-only
// fields; admin schema extends with role/moderation flags. Used by API routes
// with validateRequestBody.

import { z } from 'zod'

/**
 * Validated body for PATCH /api/profiles/me — user-editable fields only.
 */
export const updateOwnProfileSchema = z
	.object({
		display_name: z.string().min(1).max(80).optional(),
		avatar_url: z.string().url().optional(),
		// E.164: + then 2–15 digits (ITU-T style length bound)
		phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
		city: z.string().max(100).optional(),
		area: z.string().max(100).optional(),
		bio: z.string().max(500).optional(),
		// URL slug segment: lowercase alnum + underscore
		handle: z.string().regex(/^[a-z0-9_]{3,30}$/).optional(),
		locale: z.enum(['en', 'ur']).optional(),
	})
	.strict()

/**
 * Admin PATCH body — extends user fields with moderation columns.
 */
export const adminUpdateProfileSchema = updateOwnProfileSchema
	.extend({
		role: z.enum(['user', 'seller', 'tester', 'admin']).optional(),
		is_verified: z.boolean().optional(),
		is_banned: z.boolean().optional(),
	})
	.strict()

export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>
export type AdminUpdateProfileInput = z.infer<typeof adminUpdateProfileSchema>
