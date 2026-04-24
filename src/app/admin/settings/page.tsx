// ============================================================================
// Admin Platform Settings Page
// ============================================================================
//
// Async RSC: fetches all platform settings and passes to shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listPlatformSettings } from "@/lib/features/admin/services";

import AdminSettingsShell from "./shell";

export default async function AdminSettingsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");
	if (!session.roles.includes("admin")) redirect("/403");

	const { data, error } = await listPlatformSettings();
	if (error) throw new Error("Failed to load settings");

	return <AdminSettingsShell settings={data} />;
}
