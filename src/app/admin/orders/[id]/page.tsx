// ============================================================================
// Admin Order Detail Page
// ============================================================================
//
// Async RSC: fetches a single order's full detail and passes to shell.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getAdminOrderDetail } from "@/lib/features/admin/services";

import AdminOrderDetailShell from "./shell";

export default async function AdminOrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { id } = await params;
	const { data, error } = await getAdminOrderDetail(id);

	if (error || !data) notFound();

	return <AdminOrderDetailShell order={data} />;
}
