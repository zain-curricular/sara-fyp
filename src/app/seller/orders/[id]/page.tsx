// ============================================================================
// Seller Order Detail Page — RSC
// ============================================================================
//
// Fetches order detail for the authenticated seller. Verifies the seller
// is the owner of this order before rendering.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";
import SellerOrderDetailShell from "./shell";

type PageProps = {
	params: Promise<{ id: string }>;
};

export default async function SellerOrderDetailPage({ params }: PageProps) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/seller/orders");
	if (!session.roles.includes("seller")) redirect("/");

	const { id } = await params;
	const { data: order, error } = await getOrderDetail(id, session.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load order");
	}

	if (!order) notFound();

	// Verify this user is the seller (not buyer accidentally viewing)
	if (order.sellerId !== session.userId) notFound();

	return <SellerOrderDetailShell order={order} />;
}
