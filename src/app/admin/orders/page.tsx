// ============================================================================
// Admin Orders Page
// ============================================================================
//
// Async RSC: fetches orders with optional status filter.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminOrders } from "@/lib/features/admin/services";

import AdminOrdersShell from "./shell";

export default async function AdminOrdersPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { status } = await searchParams;

	const { data, error } = await listAdminOrders(status);
	if (error) throw new Error("Failed to load orders");

	return <AdminOrdersShell orders={data} initialStatus={status ?? "all"} />;
}
