// ============================================================================
// Integration — Demo seed integrity + money identity
// ============================================================================
//
// Asserts the Phase 4 demo dataset volumes and the programme-wide money identity
// (INDEX §9): every released escrow that belongs to an order has a matching
// payout of exactly seller_payout. Runs against local Supabase (service role).
// Requires `supabase start` + a seeded DB (`supabase db reset`).

import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { canRunSupabaseIntegrationTests } from "./env";

const run = canRunSupabaseIntegrationTests ? describe : describe.skip;

function admin(): SupabaseClient {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

async function count(
	supabase: SupabaseClient,
	table: string,
	col?: string,
	val?: string | number | boolean,
): Promise<number> {
	let q = supabase.from(table).select("*", { count: "exact", head: true });
	if (col !== undefined) q = q.eq(col, val);
	const { count: c, error } = await q;
	if (error) throw new Error(`${table}: ${error.message}`);
	return c ?? 0;
}

run("demo seed integrity", () => {
	const supabase = admin();

	it("has the headline volumes", async () => {
		expect(await count(supabase, "seller_stores")).toBeGreaterThanOrEqual(50);
		expect(await count(supabase, "listings", "status", "active")).toBeGreaterThanOrEqual(300);
		expect(await count(supabase, "orders")).toBeGreaterThanOrEqual(300);
		expect(await count(supabase, "orders", "ss_status", "completed")).toBeGreaterThanOrEqual(120);
		expect(await count(supabase, "payouts")).toBeGreaterThanOrEqual(120);
		expect(await count(supabase, "reviews")).toBeGreaterThanOrEqual(100);
		expect(await count(supabase, "fraud_signals")).toBeGreaterThanOrEqual(10);
	});

	it("every active listing has at least one image", async () => {
		const { data: active, error: e1 } = await supabase.from("listings").select("id").eq("status", "active");
		expect(e1).toBeNull();
		const activeIds = (active ?? []).map((l) => l.id as string);

		// Page through all listing_images (PostgREST caps a single response at 1000).
		const withImage = new Set<string>();
		for (let from = 0; ; from += 1000) {
			const { data, error } = await supabase
				.from("listing_images")
				.select("listing_id")
				.range(from, from + 999);
			if (error) throw new Error(error.message);
			(data ?? []).forEach((r) => withImage.add(r.listing_id as string));
			if (!data || data.length < 1000) break;
		}

		const missing = activeIds.filter((id) => !withImage.has(id));
		expect(missing.length).toBe(0);
	});

	it("money identity holds — released escrow == payout (seller_payout)", async () => {
		const { data: escrows, error: e1 } = await supabase
			.from("escrow_transactions")
			.select("order_id, seller_payout")
			.eq("ss_status", "released")
			.not("order_id", "is", null);
		expect(e1).toBeNull();

		const { data: payouts, error: e2 } = await supabase
			.from("payouts")
			.select("order_id, amount")
			.not("order_id", "is", null);
		expect(e2).toBeNull();

		const payoutByOrder = new Map((payouts ?? []).map((p) => [p.order_id as string, Number(p.amount)]));

		let total = 0;
		let matches = 0;
		for (const e of escrows ?? []) {
			const p = payoutByOrder.get(e.order_id as string);
			if (p != null) {
				total++;
				if (p === Number(e.seller_payout)) matches++;
			}
		}

		expect(total).toBeGreaterThanOrEqual(100);
		expect(matches).toBe(total);
	});
});
