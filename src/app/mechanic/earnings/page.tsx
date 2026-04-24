// ============================================================================
// Mechanic Earnings — Page (RSC)
// ============================================================================
//
// Displays payouts for the mechanic. Auth server-side, data fetch via
// client shell hitting /api/mechanic/earnings.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import MechanicEarningsShell from "./shell";

export const metadata = { title: "Earnings — ShopSmart Mechanic" };

export default async function MechanicEarningsPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/earnings");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	return <MechanicEarningsShell />;
}
