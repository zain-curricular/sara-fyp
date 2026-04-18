import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";

import OnboardingPhoneShell from "./shell";

export default async function OnboardingPhonePage() {
	const profile = await fetchMyProfile();
	if (!profile) {
		redirect("/sign-in");
	}
	if (profile.onboarding_completed_at) {
		redirect("/buyer");
	}

	return <OnboardingPhoneShell />;
}
