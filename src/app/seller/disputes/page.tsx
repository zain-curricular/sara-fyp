// ============================================================================
// Seller Disputes Page
// ============================================================================
//
// RSC: fetches disputes for the authenticated seller.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listDisputesForSeller } from "@/lib/features/disputes/services";
import SellerDisputesShell from "./shell";

export const metadata = { title: "Disputes — ShopSmart Seller" };

export default async function SellerDisputesPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	const { data, error } = await listDisputesForSeller(user.id);

	if (error) throw new Error("Failed to load disputes");

	return <SellerDisputesShell disputes={data} />;
}
