// ============================================================================
// Confirm Receipt Page — RSC
// ============================================================================
//
// Validates that the order exists, belongs to the buyer, and is in
// 'delivered' status before rendering the confirmation shell.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";

import ConfirmReceiptShell from "./shell";

type Props = { params: Promise<{ id: string }> };

export default async function ConfirmReceiptPage({ params }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { id: orderId } = await params;

	const { data: order, error } = await getOrderDetail(orderId, session.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load order");
	}

	if (!order) notFound();
	if (order.buyerId !== session.userId) notFound();

	return (
		<ConfirmReceiptShell
			orderId={orderId}
			orderNumber={order.orderNumber}
			total={order.total}
			itemCount={order.items.length}
			status={order.ssStatus}
		/>
	);
}
