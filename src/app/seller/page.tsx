// ============================================================================
// Seller Dashboard — Page (RSC)
// ============================================================================
//
// Auth-guarded entry point for the seller area. Redirects unauthenticated
// users to login. Seller role enforced by middleware — this just adds the
// explicit server-side guard for fast redirects.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import SellerShell from "./shell";

export const metadata = { title: "Seller Dashboard — ShopSmart" };

export default async function SellerHomePage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/seller");
	if (!session.roles.includes("seller") && !session.roles.includes("admin")) {
		redirect("/become-a-seller");
	}

	return <SellerShell />;
}
