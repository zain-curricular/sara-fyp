// ============================================================================
// Onboarding — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

const e164Phone = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid E.164 phone number')

export const completeOnboardingSchema = z
	.object({
		display_name: z.string().min(1).max(80),
		phone_number: e164Phone,
		city: z.string().min(1).max(100),
		handle: z.string().regex(/^[a-z0-9_]{3,30}$/).optional(),
		locale: z.enum(['en', 'ur']).optional().default('en'),
	})
	.strict()

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>

export const sendPhoneOtpSchema = z
	.object({
		phone_number: e164Phone,
	})
	.strict()

export const verifyPhoneOtpSchema = z
	.object({
		phone_number: e164Phone,
		code: z.string().regex(/^\d{6}$/),
	})
	.strict()
