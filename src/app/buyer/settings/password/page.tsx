// ============================================================================
// Buyer Password Settings Page — RSC
// ============================================================================
//
// Auth guard only — password change is done client-side via Supabase SDK.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import PasswordSettingsShell from "./shell";

export default async function BuyerPasswordSettingsPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/settings/password");

	return <PasswordSettingsShell />;
}
