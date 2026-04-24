// ============================================================================
// Admin Dashboard Page
// ============================================================================
//
// Async RSC: fetches KPIs + recent admin actions then delegates to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getAdminKPIs, listRecentAdminActions } from "@/lib/features/admin/services";

import AdminDashboardShell from "./shell";

export default async function AdminDashboardPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const [kpisResult, actionsResult] = await Promise.all([
		getAdminKPIs(),
		listRecentAdminActions(10),
	]);

	if (kpisResult.error || !kpisResult.data) {
		throw new Error("Failed to load dashboard KPIs");
	}

	return (
		<AdminDashboardShell
			kpis={kpisResult.data}
			recentActions={actionsResult.data}
		/>
	);
}
