// ============================================================================
// Seller Inventory — Page (RSC)
// ============================================================================
//
// Aggregated stock view across all seller listings. Shows each listing with
// its current stock quantity and allows quick stock updates.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import InventoryShell from "./shell";

export const metadata = { title: "Inventory — ShopSmart Seller" };

export default async function InventoryPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/seller/inventory");
	if (!session.roles.includes("seller") && !session.roles.includes("admin")) {
		redirect("/become-a-seller");
	}

	const supabase = await createServerSupabaseClient();

	const { data: listings } = await supabase
		.from("listings")
		.select("id, title, price, status, stock, min_order_qty, created_at")
		.eq("user_id", session.userId)
		.is("deleted_at", null)
		.order("created_at", { ascending: false });

	return <InventoryShell listings={listings ?? []} />;
}
