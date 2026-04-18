import { z } from "zod";

const e164Phone = z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid E.164 phone number");

/** POST /api/onboarding/complete */
export const completeOnboardingSchema = z
	.object({
		display_name: z.string().min(1).max(80),
		phone_number: e164Phone,
		city: z.string().min(1).max(100),
		handle: z
			.union([z.literal(""), z.string().regex(/^[a-z0-9_]{3,30}$/)])
			.transform((v) => (v === "" ? undefined : v))
			.optional(),
		locale: z.enum(["en", "ur"]).optional().default("en"),
	})
	.strict();

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

/** POST /api/onboarding/phone/send-otp */
export const sendPhoneOtpSchema = z
	.object({
		phone_number: e164Phone,
	})
	.strict();

/** POST /api/onboarding/phone/verify-otp */
export const verifyPhoneOtpSchema = z
	.object({
		phone_number: e164Phone,
		code: z.string().regex(/^\d{6}$/),
	})
	.strict();

export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
