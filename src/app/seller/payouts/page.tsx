// ============================================================================
// Seller Payouts Page
// ============================================================================
//
// RSC: fetches payout records for the authenticated seller from the `payouts`
// table. Real query errors surface to the route error boundary (no silent swallow).

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import PayoutsShell from "./shell";

export const metadata = { title: "Payouts — ShopSmart Seller" };

export type PayoutRecord = {
	id: string;
	periodStart: string;
	periodEnd: string;
	amount: number;
	status: "pending" | "processing" | "paid" | "failed";
	method: string | null;
	createdAt: string;
};

export default async function SellerPayoutsPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	// Fetch payouts for the authenticated seller.
	const { data, error } = await supabase
		.from("payouts")
		.select("id, period_start, period_end, amount, status, method, created_at")
		.eq("seller_id", user.id)
		.order("created_at", { ascending: false })
		.limit(50);

	if (error) {
		//.. Surface real failures to the route error boundary rather than
		//.. swallowing them — the old try/catch hid the wrong-table bug as an
		//.. empty state.
		throw new Error(`Failed to load payouts: ${error.message}`);
	}

	const payouts: PayoutRecord[] = (data ?? []).map((row) => {
		const r = row as Record<string, unknown>;
		return {
			id: r.id as string,
			periodStart: r.period_start as string,
			periodEnd: r.period_end as string,
			amount: r.amount as number,
			status: r.status as PayoutRecord["status"],
			method: (r.method as string | null) ?? null,
			createdAt: r.created_at as string,
		};
	});

	return <PayoutsShell payouts={payouts} />;
}
