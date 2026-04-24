import type { FetchMyProfileResult } from "@/lib/features/profiles/fetch-my-profile";

export type PostSignInRedirectOptions = {
	/** When true, phone OTP is not required (Supabase `email_confirmed_at` is set). */
	emailVerified?: boolean;
};

/**
 * Server-side routing after Supabase session exists — used by `/continue` RSC and tests.
 */
export function getPostSignInRedirectPath(
	profile: FetchMyProfileResult,
	options?: PostSignInRedirectOptions,
): string {
	const emailVerified = options?.emailVerified ?? false;
	if (profile === null) {
		return "/sign-in";
	}
	if (profile === "no_profile") {
		return "/onboarding/phone";
	}
	if (profile.onboarding_completed_at) {
		return "/buyer";
	}
	if (!profile.phone_verified && !emailVerified) {
		return "/onboarding/phone";
	}
	return "/onboarding/profile";
}
