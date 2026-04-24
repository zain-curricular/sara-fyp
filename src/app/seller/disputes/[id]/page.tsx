// ============================================================================
// Seller Dispute Detail Page
// ============================================================================
//
// RSC: fetches full dispute detail for authenticated seller.

import { notFound, redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisputeDetail } from "@/lib/features/disputes/services";
import DisputeDetailShell from "./shell";

export const metadata = { title: "Dispute — ShopSmart Seller" };

type Params = { params: Promise<{ id: string }> };

export default async function SellerDisputeDetailPage({ params }: Params) {
	const { id } = await params;

	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	const { data, error } = await getDisputeDetail(id, user.id);

	if (error) {
		const msg = error instanceof Error ? error.message : "";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load dispute");
	}

	if (!data) notFound();

	return <DisputeDetailShell dispute={data} userId={user.id} />;
}
