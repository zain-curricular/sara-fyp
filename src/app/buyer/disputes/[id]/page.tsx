// ============================================================================
// Buyer Dispute Detail Page — RSC
// ============================================================================
//
// Fetches a single dispute for the authenticated buyer. Only the buyer who
// opened the dispute can view it here.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getDisputeDetail } from "@/lib/features/disputes/services";

import DisputeDetailShell from "./shell";

type Props = { params: Promise<{ id: string }> };

export default async function BuyerDisputeDetailPage({ params }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { id } = await params;

	const { data: dispute, error } = await getDisputeDetail(id, session.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load dispute");
	}

	if (!dispute) notFound();

	// Only the opener (buyer) can view in this buyer route
	if (dispute.openedBy !== session.userId) notFound();

	return <DisputeDetailShell dispute={dispute} />;
}
