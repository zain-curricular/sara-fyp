import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import OnboardingPhoneShell from "./shell";

export default async function OnboardingPhonePage() {
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
		return <OnboardingPhoneShell emailVerified={emailVerified} initialPhone={null} />;
	}
	if (profile.onboarding_completed_at) {
		redirect("/buyer");
	}

	return (
		<OnboardingPhoneShell emailVerified={emailVerified} initialPhone={profile.phone_number} />
	);
}
