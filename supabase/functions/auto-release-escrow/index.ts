// ============================================================================
// Auto-Release Escrow — Supabase Edge Function
// ============================================================================
//
// Runs on a schedule (cron via Supabase dashboard or pg_cron).
// Finds orders in 'delivered' status for more than 7 days with no open dispute,
// auto-releases escrow to the seller and marks order 'completed'.
//
// Trigger: schedule every 6 hours via Supabase cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RELEASE_AFTER_DAYS = 7;

Deno.serve(async (_req) => {
	const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - RELEASE_AFTER_DAYS);

	// Find delivered orders older than cutoff with no open dispute
	const { data: orders, error } = await supabase
		.from("orders")
		.select("id, store_id")
		.eq("ss_status", "delivered")
		.lt("updated_at", cutoff.toISOString())
		.is("deleted_at", null);

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}

	let released = 0;
	const errors: string[] = [];

	for (const order of orders ?? []) {
		// Check no open dispute
		const { count } = await supabase
			.from("disputes")
			.select("id", { count: "exact", head: true })
			.eq("order_id", order.id)
			.in("status", ["open", "under_review"]);

		if ((count ?? 0) > 0) continue;

		// Update order to completed
		const { error: updateError } = await supabase
			.from("orders")
			.update({ ss_status: "completed", completed_at: new Date().toISOString() })
			.eq("id", order.id);

		if (updateError) {
			errors.push(`${order.id}: ${updateError.message}`);
			continue;
		}

		// Release escrow transaction
		await supabase
			.from("escrow_transactions")
			.update({ status: "released", released_at: new Date().toISOString() })
			.eq("order_id", order.id)
			.eq("status", "held");

		released++;
	}

	return new Response(
		JSON.stringify({ released, errors, total: orders?.length ?? 0 }),
		{ headers: { "Content-Type": "application/json" } },
	);
});
