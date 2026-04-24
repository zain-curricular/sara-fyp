// ============================================================================
// Admin Disputes Page
// ============================================================================
//
// Async RSC: fetches disputes with optional status filter.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminDisputes } from "@/lib/features/admin/services";

import AdminDisputesShell from "./shell";

export default async function AdminDisputesPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { status } = await searchParams;

	const { data, error } = await listAdminDisputes(status);
	if (error) throw new Error("Failed to load disputes");

	return <AdminDisputesShell disputes={data} initialStatus={status ?? "open"} />;
}
