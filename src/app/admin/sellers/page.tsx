// ============================================================================
// Admin Sellers Page
// ============================================================================
//
// Async RSC: fetches all seller stores and passes to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminSellers } from "@/lib/features/admin/services";

import AdminSellersShell from "./shell";

export default async function AdminSellersPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { data, error } = await listAdminSellers();
	if (error) throw new Error("Failed to load sellers");

	return <AdminSellersShell sellers={data} adminId={session.userId} />;
}
