// ============================================================================
// API: Mechanic Earnings — GET
// ============================================================================
//
// GET /api/mechanic/earnings
//
// Returns a list of payouts for the authenticated mechanic from the payouts
// table (where seller_id = mechanic user id). Includes this-month and
// all-time totals in the response envelope.
// Requires mechanic role.

import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
	const auth = await requireRole("mechanic");
	if (!auth.ok) return auth.error;

	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("payouts")
		.select("id, amount, status, created_at, reference")
		.eq("seller_id", auth.userId)
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to load earnings" },
			{ status: 500 },
		);
	}

	const payouts = data ?? [];

	// Calculate totals
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const allTime = payouts.reduce((sum, p) => sum + (p.amount as number ?? 0), 0);
	const thisMonth = payouts
		.filter((p) => new Date(p.created_at as string) >= startOfMonth)
		.reduce((sum, p) => sum + (p.amount as number ?? 0), 0);

	return NextResponse.json({
		ok: true,
		data: {
			payouts,
			totals: { allTime, thisMonth },
		},
	});
}
