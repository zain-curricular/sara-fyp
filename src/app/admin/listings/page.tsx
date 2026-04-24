// ============================================================================
// Admin Listings Page
// ============================================================================
//
// Async RSC: fetches listings with optional status + search filter.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminListings } from "@/lib/features/admin/services";

import AdminListingsShell from "./shell";

export default async function AdminListingsPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string; search?: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { status, search } = await searchParams;

	const { data, error } = await listAdminListings(status, search);
	if (error) throw new Error("Failed to load listings");

	return (
		<AdminListingsShell
			listings={data}
			initialStatus={status ?? "all"}
			initialSearch={search ?? ""}
		/>
	);
}
