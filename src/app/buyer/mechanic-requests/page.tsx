// ============================================================================
// Buyer Mechanic Requests List Page — RSC
// ============================================================================
//
// Fetches all mechanic verification requests for the authenticated buyer.
// Passes data to the client shell for display.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listMechanicRequestsForBuyer } from "@/lib/features/mechanic-requests/services";

import RequestsListShell from "./shell";

export default async function BuyerMechanicRequestsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/mechanic-requests");

	const { data: requests, error } = await listMechanicRequestsForBuyer(
		session.userId,
	);
	if (error) throw new Error("Failed to load mechanic requests");

	return <RequestsListShell requests={requests} />;
}
