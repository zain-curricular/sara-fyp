// ============================================================================
// Mechanic Requests Pool — Page (RSC)
// ============================================================================
//
// Displays the pool of pending verification requests in the mechanic's
// service areas. Auth + data fetch server-side, passed to client shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listPendingRequests } from "@/lib/features/mechanic/services";

import MechanicRequestsShell from "./shell";

export const metadata = { title: "Verification Requests — ShopSmart Mechanic" };

export default async function MechanicRequestsPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/requests");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	const { data: requests } = await listPendingRequests(session.userId);

	return <MechanicRequestsShell requests={requests} />;
}
