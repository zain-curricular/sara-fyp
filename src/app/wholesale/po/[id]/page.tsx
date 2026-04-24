// ============================================================================
// Purchase Order Detail Page
// ============================================================================
//
// Authenticated RSC that fetches a single wholesale purchase order by ID,
// including its line items and linked listing titles/prices. Redirects to
// login if the user is not authenticated.

import { redirect, notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/auth/guards";
import PODetailShell from "./shell";

type PODetailPageProps = {
	params: Promise<{ id: string }>;
};

export default async function PODetailPage({ params }: PODetailPageProps) {
	const { id } = await params;

	const session = await getServerSession();
	if (!session) redirect(`/login?next=/wholesale/po/${id}`);

	const supabase = await createServerSupabaseClient();

	const { data: order } = await supabase
		.from("orders")
		.select("*, order_items(*, listing:listings(title, price))")
		.eq("id", id)
		.maybeSingle();

	if (!order) notFound();

	return <PODetailShell order={order} />;
}
