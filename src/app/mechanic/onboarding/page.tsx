// ============================================================================
// Mechanic Onboarding — Page (RSC)
// ============================================================================
//
// If mechanic profile already exists, redirect to /mechanic dashboard.
// Otherwise render the onboarding form shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getMechanicProfile } from "@/lib/features/mechanic/services";

import MechanicOnboardingShell from "./shell";

export const metadata = { title: "Become a Mechanic — ShopSmart" };

export default async function MechanicOnboardingPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/onboarding");

	// If already a mechanic → dashboard
	if (session.roles.includes("mechanic")) {
		const { data } = await getMechanicProfile(session.userId);
		if (data) redirect("/mechanic");
	}

	return <MechanicOnboardingShell />;
}
