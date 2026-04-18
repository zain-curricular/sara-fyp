import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";

import OnboardingProfileShell from "./shell";

export default async function OnboardingProfilePage() {
	const profile = await fetchMyProfile();
	if (!profile) {
		redirect("/sign-in");
	}
	if (profile.onboarding_completed_at) {
		redirect("/buyer");
	}
	if (!profile.phone_verified) {
		redirect("/onboarding/phone");
	}

	return <OnboardingProfileShell key={profile.updated_at} profile={profile} />;
}
