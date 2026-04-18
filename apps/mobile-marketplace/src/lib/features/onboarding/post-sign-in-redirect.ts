import type { OwnProfile } from "@/lib/features/profiles/types";

/**
 * Server-side routing after Supabase session exists — used by `/continue` RSC and tests.
 * Mirrors the branching previously done in the sign-in shell client.
 */
export function getPostSignInRedirectPath(profile: OwnProfile | null): string {
	if (!profile) {
		return "/sign-in";
	}
	if (profile.onboarding_completed_at) {
		return "/buyer";
	}
	if (!profile.phone_verified) {
		return "/onboarding/phone";
	}
	return "/onboarding/profile";
}
