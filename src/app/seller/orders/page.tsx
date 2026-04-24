// ============================================================================
// Seller Orders Page — RSC
// ============================================================================
//
// Fetches all orders for the authenticated seller and passes to SellerOrdersShell.
// Requires the seller role.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrdersForSeller } from "@/lib/features/orders/services";
import SellerOrdersShell from "./shell";

export const metadata = { title: "Orders — Seller Dashboard" };

export default async function SellerOrdersPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/seller/orders");

	if (!session.roles.includes("seller")) redirect("/");

	const { data: orders, error } = await getOrdersForSeller(session.userId);
	if (error) throw new Error("Failed to load orders");

	return <SellerOrdersShell initialOrders={orders ?? []} />;
}
