// ============================================================================
// New Address Page — RSC
// ============================================================================
//
// Auth guard only — the form is entirely client-side. No server data needed.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import NewAddressShell from "./shell";

export default async function NewAddressPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/addresses/new");

	return <NewAddressShell />;
}
