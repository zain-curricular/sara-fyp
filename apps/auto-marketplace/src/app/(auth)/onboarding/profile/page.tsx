import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";
import type { OwnProfile } from "@/lib/features/profiles/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import OnboardingProfileShell from "./shell";

export default async function OnboardingProfilePage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const emailVerified = Boolean(user?.email_confirmed_at);

	const profile = await fetchMyProfile();
	if (profile === null) {
		redirect("/sign-in");
	}

	if (profile === "no_profile") {
		if (!emailVerified) redirect("/onboarding/phone");

		const stubProfile: OwnProfile = {
			id: user!.id,
			role: "user",
			display_name: (user!.user_metadata?.full_name as string) ?? null,
			avatar_url: (user!.user_metadata?.avatar_url as string) ?? null,
			phone_number: null,
			phone_verified: false,
			email: user!.email ?? null,
			city: null,
			area: null,
			bio: null,
			is_verified: false,
			is_banned: false,
			avg_rating: 0,
			total_reviews: 0,
			total_listings: 0,
			total_sales: 0,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			handle: null,
			onboarding_completed_at: null,
			last_seen_at: null,
			locale: "en",
		};
		return <OnboardingProfileShell emailVerified={true} profile={stubProfile} />;
	}

	if (profile.onboarding_completed_at) {
		redirect("/buyer");
	}
	if (!profile.phone_verified && !emailVerified) {
		redirect("/onboarding/phone");
	}

	return (
		<OnboardingProfileShell
			key={profile.updated_at}
			emailVerified={emailVerified}
			profile={profile}
		/>
	);
}
