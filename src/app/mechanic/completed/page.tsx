// ============================================================================
// Mechanic Completed — Page (RSC)
// ============================================================================
//
// Lists all completed verifications for the authenticated mechanic.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listCompletedRequests } from "@/lib/features/mechanic/services";

import MechanicCompletedShell from "./shell";

export const metadata = { title: "Completed Verifications — ShopSmart Mechanic" };

export default async function MechanicCompletedPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/completed");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	const { data: requests } = await listCompletedRequests(session.userId);

	return <MechanicCompletedShell requests={requests} />;
}
