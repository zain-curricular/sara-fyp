// ============================================================================
// Admin Payouts Page
// ============================================================================
//
// Async RSC: fetches all payout records and passes to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminPayouts } from "@/lib/features/admin/services";

import AdminPayoutsShell from "./shell";

export default async function AdminPayoutsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { data, error } = await listAdminPayouts();
	if (error) throw new Error("Failed to load payouts");

	return <AdminPayoutsShell payouts={data} />;
}
