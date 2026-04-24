// ============================================================================
// Admin Catalog Page
// ============================================================================
//
// Async RSC: fetches categories and vehicles for the catalog management shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminCategories, listAdminVehicles } from "@/lib/features/admin/services";

import AdminCatalogShell from "./shell";

export default async function AdminCatalogPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const [categoriesResult, vehiclesResult] = await Promise.all([
		listAdminCategories(),
		listAdminVehicles(),
	]);

	return (
		<AdminCatalogShell
			categories={categoriesResult.data}
			vehicles={vehiclesResult.data}
		/>
	);
}
