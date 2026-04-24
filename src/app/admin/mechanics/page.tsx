// ============================================================================
// Admin Mechanics Page
// ============================================================================
//
// Async RSC: fetches all mechanic profiles and passes to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminMechanics } from "@/lib/features/admin/services";

import AdminMechanicsShell from "./shell";

export default async function AdminMechanicsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { data, error } = await listAdminMechanics();
	if (error) throw new Error("Failed to load mechanics");

	return <AdminMechanicsShell mechanics={data} />;
}
