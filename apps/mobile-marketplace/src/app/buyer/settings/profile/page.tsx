import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";

import ProfileSettingsShell from "./shell";

export default async function BuyerProfileSettingsPage() {
	const profile = await fetchMyProfile();
	if (profile === null) {
		redirect("/login");
	}
	if (profile === "no_profile") {
		redirect("/onboarding/phone");
	}

	return <ProfileSettingsShell profile={profile} />;
}
