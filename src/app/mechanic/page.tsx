// ============================================================================
// Mechanic Dashboard — Page (RSC)
// ============================================================================
//
// Fetches pending, assigned, and completed request counts server-side and
// passes them to the client shell as initial props.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import {
	listPendingRequests,
	listAssignedRequests,
	listCompletedRequests,
	getMechanicProfile,
} from "@/lib/features/mechanic/services";

import MechanicDashboardShell from "./shell";

export const metadata = { title: "Mechanic Dashboard — ShopSmart" };

export default async function MechanicDashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	const [profileResult, pendingResult, assignedResult, completedResult] =
		await Promise.all([
			getMechanicProfile(session.userId),
			listPendingRequests(session.userId),
			listAssignedRequests(session.userId),
			listCompletedRequests(session.userId),
		]);

	return (
		<MechanicDashboardShell
			profile={profileResult.data}
			pendingCount={pendingResult.data.length}
			assignedRequests={assignedResult.data}
			completedCount={completedResult.data.length}
		/>
	);
}
