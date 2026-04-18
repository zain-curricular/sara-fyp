import { redirect } from "next/navigation";

import { fetchMyProfile } from "@/lib/features/profiles/fetch-my-profile";
import { sendPhoneOtpSchema } from "@/lib/features/onboarding/schemas";

import OnboardingVerifyShell from "./shell";

type Props = { searchParams: Promise<{ phone?: string }> };

export default async function OnboardingVerifyPage({ searchParams }: Props) {
	const profile = await fetchMyProfile();
	if (!profile) {
		redirect("/sign-in");
	}
	if (profile.onboarding_completed_at) {
		redirect("/buyer");
	}

	const { phone: raw } = await searchParams;
	if (!raw) {
		redirect("/onboarding/phone");
	}

	let decoded = raw;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		redirect("/onboarding/phone");
	}

	const parsed = sendPhoneOtpSchema.safeParse({ phone_number: decoded });
	if (!parsed.success) {
		redirect("/onboarding/phone");
	}

	return <OnboardingVerifyShell phone={parsed.data.phone_number} />;
}
