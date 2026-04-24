// ============================================================================
// Open Dispute Page — RSC
// ============================================================================
//
// Auth + order ownership check. If a dispute already exists for this order,
// redirects to the dispute detail. Otherwise renders the dispute form.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";
import { listDisputesForBuyer } from "@/lib/features/disputes/services";

import DisputeOpenShell from "./shell";

type Props = { params: Promise<{ id: string }> };

export default async function OpenDisputePage({ params }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { id: orderId } = await params;

	// Verify order exists and belongs to this buyer
	const { data: order, error: orderError } = await getOrderDetail(
		orderId,
		session.userId,
	);

	if (orderError) {
		const msg =
			orderError instanceof Error ? orderError.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load order");
	}

	if (!order) notFound();
	if (order.buyerId !== session.userId) notFound();

	// Check if there's already an open dispute
	const { data: disputes } = await listDisputesForBuyer(session.userId);
	const existing = (disputes ?? []).find((d) => d.orderId === orderId);

	if (existing) {
		redirect(`/buyer/disputes/${existing.id}`);
	}

	return (
		<DisputeOpenShell
			orderId={orderId}
			orderNumber={order.orderNumber}
			total={order.total}
		/>
	);
}
