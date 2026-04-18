import { describe, expect, it } from "vitest";

import { completeOnboardingSchema, sendPhoneOtpSchema, verifyPhoneOtpSchema } from "./schemas";

describe("sendPhoneOtpSchema", () => {
	it("accepts E.164", () => {
		expect(sendPhoneOtpSchema.safeParse({ phone_number: "+923001234567" }).success).toBe(true);
	});

	it("rejects invalid phone", () => {
		expect(sendPhoneOtpSchema.safeParse({ phone_number: "0300" }).success).toBe(false);
	});
});

describe("verifyPhoneOtpSchema", () => {
	it("accepts 6-digit code", () => {
		expect(
			verifyPhoneOtpSchema.safeParse({ phone_number: "+923001234567", code: "123456" }).success,
		).toBe(true);
	});

	it("rejects short code", () => {
		expect(
			verifyPhoneOtpSchema.safeParse({ phone_number: "+923001234567", code: "12345" }).success,
		).toBe(false);
	});
});

describe("completeOnboardingSchema", () => {
	it("parses required fields and optional handle", () => {
		const parsed = completeOnboardingSchema.safeParse({
			display_name: "Ada",
			phone_number: "+923001234567",
			city: "Lahore",
			handle: "",
			locale: "en",
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.handle).toBeUndefined();
		}
	});

	it("rejects handle mismatch", () => {
		expect(
			completeOnboardingSchema.safeParse({
				display_name: "Ada",
				phone_number: "+923001234567",
				city: "Lahore",
				handle: "Bad Handle",
				locale: "en",
			}).success,
		).toBe(false);
	});
});
