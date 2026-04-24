// ============================================================================
// Become a Seller Page
// ============================================================================
//
// Server component that protects the route — redirects to /login if not
// authenticated, redirects to /seller if the user already has the seller role.
// Otherwise renders the BecomeASellerShell onboarding wizard.

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";

import BecomeASellerShell from "./shell";

export const metadata: Metadata = {
	title: "Become a seller — ShopSmart",
	description: "Set up your store and start selling spare parts on ShopSmart.",
};

export default async function BecomeASellerPage() {
	const session = await getServerSession();

	if (!session) {
		redirect("/login?next=/become-a-seller");
	}

	// Already a seller — send to dashboard
	if (session.roles.includes("seller")) {
		redirect("/seller");
	}

	return <BecomeASellerShell />;
}
