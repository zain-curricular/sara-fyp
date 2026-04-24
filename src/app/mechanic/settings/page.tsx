// ============================================================================
// Mechanic Settings — Page (RSC)
// ============================================================================
//
// Loads mechanic profile server-side and renders the settings form.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getMechanicProfile } from "@/lib/features/mechanic/services";

import MechanicSettingsShell from "./shell";

export const metadata = { title: "Mechanic Settings — ShopSmart" };

export default async function MechanicSettingsPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/settings");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	const { data: profile } = await getMechanicProfile(session.userId);

	return <MechanicSettingsShell profile={profile} />;
}
