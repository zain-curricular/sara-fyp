// ============================================================================
// Admin Fraud Signals Page
// ============================================================================
//
// Async RSC: fetches fraud signals with optional status filter.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listFraudSignals } from "@/lib/features/admin/services";

import AdminFraudShell from "./shell";

export default async function AdminFraudPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { status } = await searchParams;

	const { data, error } = await listFraudSignals(status);
	if (error) throw new Error("Failed to load fraud signals");

	return <AdminFraudShell signals={data} initialStatus={status ?? "all"} />;
}
