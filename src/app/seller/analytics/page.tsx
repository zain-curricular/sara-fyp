// ============================================================================
// Seller Analytics Page
// ============================================================================
//
// RSC: authenticates seller, SSR fetches analytics, renders AnalyticsShell.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerAnalytics } from "@/lib/features/seller-store/services";
import AnalyticsShell from "./shell";

export const metadata = { title: "Analytics — ShopSmart Seller" };

export default async function SellerAnalyticsPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	const { data, error } = await getSellerAnalytics(user.id);

	if (error) throw new Error("Failed to load analytics");

	return <AnalyticsShell initialData={data} />;
}
