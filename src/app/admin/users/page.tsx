// ============================================================================
// Admin Users Page
// ============================================================================
//
// Async RSC: reads search + role from query params, fetches user list.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/features/admin/services";

import AdminUsersShell from "./shell";

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ search?: string; role?: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { search, role } = await searchParams;

	const { data, error } = await listAdminUsers(search, role);

	if (error) throw new Error("Failed to load users");

	return (
		<AdminUsersShell
			users={data}
			initialSearch={search ?? ""}
			initialRole={role ?? "all"}
		/>
	);
}
