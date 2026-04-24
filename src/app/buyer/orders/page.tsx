// ============================================================================
// Buyer Orders Page — RSC
// ============================================================================
//
// Fetches all buyer orders server-side and passes to OrdersShell.
// Redirects unauthenticated users to sign-in.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrdersForBuyer } from "@/lib/features/orders/services";
import OrdersShell from "./shell";

export const metadata = { title: "My Orders — ShopSmart" };

export default async function BuyerOrdersPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/orders");

	const { data: orders, error } = await getOrdersForBuyer(session.userId);
	if (error) throw new Error("Failed to load orders");

	return <OrdersShell initialOrders={orders ?? []} />;
}
