// ============================================================================
// Buyer Disputes List Page — RSC
// ============================================================================
//
// Fetches all disputes opened by the authenticated buyer and passes them to
// the client shell for filtering and display.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listDisputesForBuyer } from "@/lib/features/disputes/services";

import DisputesListShell from "./shell";

export default async function BuyerDisputesPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/disputes");

	const { data: disputes, error } = await listDisputesForBuyer(session.userId);
	if (error) throw new Error("Failed to load disputes");

	return <DisputesListShell disputes={disputes} />;
}
