// ============================================================================
// Onboarding — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

const e164Phone = z
	.string()
	.trim()
	.regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number')

/** Optional when the account has a verified email (server enforces). */
const optionalPhoneForComplete = z.preprocess(
	(v) => {
		if (v === '' || v === null || v === undefined) return undefined
		return typeof v === 'string' ? v.trim() : v
	},
	e164Phone.optional(),
)

export const completeOnboardingSchema = z
	.object({
		display_name: z.string().min(1).max(80),
		phone_number: optionalPhoneForComplete,
		city: z.string().min(1).max(100),
		handle: z.string().regex(/^[a-z0-9_]{3,30}$/).optional(),
		locale: z.enum(['en', 'ur']).optional().default('en'),
	})
	.strict()

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>

export const sendPhoneOtpSchema = z
	.object({
		phone_number: z.preprocess(
			(v) => (typeof v === 'string' ? v.trim() : v),
			e164Phone,
		),
	})
	.strict()

export const verifyPhoneOtpSchema = z
	.object({
		phone_number: z.preprocess(
			(v) => (typeof v === 'string' ? v.trim() : v),
			e164Phone,
		),
		code: z.string().regex(/^\d{6}$/),
	})
	.strict()
