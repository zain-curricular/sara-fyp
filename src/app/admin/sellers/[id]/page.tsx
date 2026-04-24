// ============================================================================
// Admin Seller Detail Page
// ============================================================================
//
// Async RSC: fetches a single seller store and passes to shell.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getSellerDetail } from "@/lib/features/admin/services";

import AdminSellerDetailShell from "./shell";

export default async function AdminSellerDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { id } = await params;
	const { data, error } = await getSellerDetail(id);

	if (error) throw new Error("Failed to load seller");
	if (!data) notFound();

	return <AdminSellerDetailShell seller={data} adminId={session.userId} />;
}
