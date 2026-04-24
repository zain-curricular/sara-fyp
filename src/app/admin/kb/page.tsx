// ============================================================================
// Admin Knowledge Base Page
// ============================================================================
//
// Async RSC: fetches KB documents and passes to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listKBDocuments } from "@/lib/features/admin/services";

import AdminKBShell from "./shell";

export default async function AdminKBPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { data, error } = await listKBDocuments();

	if (error) throw new Error("Failed to load KB documents");

	return <AdminKBShell documents={data} />;
}
