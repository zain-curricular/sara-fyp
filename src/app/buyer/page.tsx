// ============================================================================
// Buyer Dashboard — Page (RSC)
// ============================================================================
//
// Auth-guarded entry point for the buyer area. Redirects unauthenticated
// users to login. Passes profile data to the client shell.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import BuyerShell from "./shell";

export const metadata = { title: "My Account — ShopSmart" };

export default async function BuyerHomePage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/buyer");

	return <BuyerShell />;
}
