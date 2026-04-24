// ============================================================================
// Buyer Order Detail Page — RSC
// ============================================================================
//
// Fetches order detail server-side and passes to OrderDetailShell.
// Redirects unauthenticated users to sign-in.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";
import OrderDetailShell from "./shell";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function BuyerOrderDetailPage({ params }: PageProps) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/orders");

	const { id } = await params;
	const { data: order, error } = await getOrderDetail(id, session.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load order");
	}

	if (!order) notFound();

	return <OrderDetailShell order={order} />;
}
