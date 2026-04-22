import { describe, expect, it } from "vitest";

import type { OwnProfile } from "@/lib/features/profiles/types";

import { getPostSignInRedirectPath } from "./post-sign-in-redirect";

function baseProfile(overrides: Partial<OwnProfile> = {}): OwnProfile {
	return {
		id: "u1",
		role: "user",
		display_name: null,
		avatar_url: null,
		phone_number: null,
		phone_verified: false,
		email: "a@b.c",
		city: null,
		area: null,
		bio: null,
		is_verified: false,
		is_banned: false,
		avg_rating: 0,
		total_reviews: 0,
		total_listings: 0,
		total_sales: 0,
		created_at: "",
		updated_at: "",
		handle: null,
		onboarding_completed_at: null,
		last_seen_at: null,
		locale: "en",
		...overrides,
	};
}

describe("getPostSignInRedirectPath", () => {
	it("sends missing profile to sign-in", () => {
		expect(getPostSignInRedirectPath(null)).toBe("/sign-in");
	});

	it("sends new user (no profile row) to phone onboarding", () => {
		expect(getPostSignInRedirectPath("no_profile")).toBe("/onboarding/phone");
	});

	it("sends completed onboarding to buyer", () => {
		expect(
			getPostSignInRedirectPath(
				baseProfile({
					onboarding_completed_at: "2025-01-01T00:00:00.000Z",
					phone_verified: true,
				}),
			),
		).toBe("/buyer");
	});

	it("sends unverified phone to phone step when email is not verified", () => {
		expect(getPostSignInRedirectPath(baseProfile({ phone_verified: false }))).toBe(
			"/onboarding/phone",
		);
	});

	it("skips phone step when email is verified but phone is not", () => {
		expect(
			getPostSignInRedirectPath(baseProfile({ phone_verified: false }), { emailVerified: true }),
		).toBe("/onboarding/profile");
	});

	it("sends verified phone but incomplete onboarding to profile step", () => {
		expect(
			getPostSignInRedirectPath(
				baseProfile({
					phone_verified: true,
					phone_number: "+923001234567",
					onboarding_completed_at: null,
				}),
			),
		).toBe("/onboarding/profile");
	});
});
