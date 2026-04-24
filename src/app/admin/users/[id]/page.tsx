// ============================================================================
// Admin User Detail Page
// ============================================================================
//
// Async RSC: fetch full user profile, orders, listings, admin actions.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getUserDetail } from "@/lib/features/admin/services";

import AdminUserDetailShell from "./shell";

export default async function AdminUserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { id } = await params;

	const { data, error } = await getUserDetail(id);

	if (error) throw new Error("Failed to load user");
	if (!data) notFound();

	return <AdminUserDetailShell user={data} adminId={session.userId} />;
}
