// ============================================================================
// Fraud Worker — Supabase Edge Function
// ============================================================================
//
// Rule-based fraud detection. Runs hourly via Supabase cron.
// Checks three fraud patterns and inserts signals into fraud_signals table
// for admin review.
//
// Rules
// -----
// 1. New seller (<7 days old) listing priced >3x category median → signal
// 2. Buyer with >3 disputes in last 30 days → signal
// 3. Active listing with sudden price drop >60% → signal
//
// Scheduling
// ----------
// Register in Supabase Dashboard > Database > Cron:
//   SELECT cron.schedule('fraud-worker-hourly', '0 * * * *',
//     $$SELECT net.http_post(url := '<function-url>/fraud-worker', ...) $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ----------------------------------------------------------------------------
// Rule thresholds
// ----------------------------------------------------------------------------

const NEW_SELLER_DAYS = 7;
const PRICE_MULTIPLIER_THRESHOLD = 3;
const DISPUTE_COUNT_THRESHOLD = 3;
const DISPUTE_WINDOW_DAYS = 30;
const PRICE_DROP_THRESHOLD = 0.6; // 60% drop

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

Deno.serve(async (_req) => {
	const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
	const signals: { rule: string; target_id: string; target_type: string; details: Record<string, unknown> }[] = [];
	const errors: string[] = [];

	// --------------------------------------------------------------------------
	// Rule 1: New seller listing priced >3x category median
	// --------------------------------------------------------------------------

	try {
		const newSellerCutoff = new Date();
		newSellerCutoff.setDate(newSellerCutoff.getDate() - NEW_SELLER_DAYS);

		// Get new sellers (profiles created within the window with seller role)
		const { data: newSellers } = await supabase
			.from("profiles")
			.select("id")
			.contains("roles", ["seller"])
			.gte("created_at", newSellerCutoff.toISOString());

		if (newSellers && newSellers.length > 0) {
			const newSellerIds = newSellers.map((s) => s.id as string);

			// Get their active listings with category
			const { data: listings } = await supabase
				.from("listings")
				.select("id, user_id, price, category_id")
				.in("user_id", newSellerIds)
				.eq("status", "active");

			if (listings && listings.length > 0) {
				// Get category medians
				const categoryIds = [...new Set(listings.map((l) => l.category_id as string))];

				for (const categoryId of categoryIds) {
					const { data: catListings } = await supabase
						.from("listings")
						.select("price")
						.eq("category_id", categoryId)
						.eq("status", "active")
						.limit(500);

					if (!catListings || catListings.length === 0) continue;

					const prices = catListings.map((l) => l.price as number).sort((a, b) => a - b);
					const median = prices[Math.floor(prices.length / 2)] ?? 0;
					const threshold = median * PRICE_MULTIPLIER_THRESHOLD;

					for (const listing of listings.filter((l) => l.category_id === categoryId)) {
						if ((listing.price as number) > threshold) {
							signals.push({
								rule: "new_seller_high_price",
								target_id: listing.id as string,
								target_type: "listing",
								details: {
									listing_id: listing.id,
									seller_id: listing.user_id,
									price: listing.price,
									category_median: median,
									multiplier: (listing.price as number) / median,
								},
							});
						}
					}
				}
			}
		}
	} catch (err) {
		errors.push(`Rule 1 error: ${String(err)}`);
	}

	// --------------------------------------------------------------------------
	// Rule 2: Buyer with >3 disputes in last 30 days
	// --------------------------------------------------------------------------

	try {
		const disputeWindowStart = new Date();
		disputeWindowStart.setDate(disputeWindowStart.getDate() - DISPUTE_WINDOW_DAYS);

		const { data: disputes } = await supabase
			.from("disputes")
			.select("buyer_id")
			.gte("created_at", disputeWindowStart.toISOString());

		if (disputes && disputes.length > 0) {
			// Count by buyer
			const counts = new Map<string, number>();
			for (const d of disputes) {
				const id = d.buyer_id as string;
				counts.set(id, (counts.get(id) ?? 0) + 1);
			}

			for (const [buyerId, count] of counts.entries()) {
				if (count > DISPUTE_COUNT_THRESHOLD) {
					signals.push({
						rule: "high_dispute_buyer",
						target_id: buyerId,
						target_type: "user",
						details: {
							buyer_id: buyerId,
							dispute_count: count,
							window_days: DISPUTE_WINDOW_DAYS,
						},
					});
				}
			}
		}
	} catch (err) {
		errors.push(`Rule 2 error: ${String(err)}`);
	}

	// --------------------------------------------------------------------------
	// Rule 3: Active listing with sudden price drop >60%
	// --------------------------------------------------------------------------

	try {
		// Look at listing price history in the last 24 hours via listing_price_history
		const priceHistoryCutoff = new Date();
		priceHistoryCutoff.setHours(priceHistoryCutoff.getHours() - 24);

		const { data: priceChanges } = await supabase
			.from("listing_price_history")
			.select("listing_id, old_price, new_price, changed_at")
			.gte("changed_at", priceHistoryCutoff.toISOString());

		if (priceChanges && priceChanges.length > 0) {
			for (const change of priceChanges) {
				const oldPrice = change.old_price as number;
				const newPrice = change.new_price as number;

				if (oldPrice > 0) {
					const dropRatio = (oldPrice - newPrice) / oldPrice;
					if (dropRatio >= PRICE_DROP_THRESHOLD) {
						signals.push({
							rule: "sudden_price_drop",
							target_id: change.listing_id as string,
							target_type: "listing",
							details: {
								listing_id: change.listing_id,
								old_price: oldPrice,
								new_price: newPrice,
								drop_percentage: Math.round(dropRatio * 100),
							},
						});
					}
				}
			}
		}
	} catch (err) {
		errors.push(`Rule 3 error: ${String(err)}`);
	}

	// --------------------------------------------------------------------------
	// Insert fraud signals (deduplicate by rule + target)
	// --------------------------------------------------------------------------

	let inserted = 0;

	for (const signal of signals) {
		try {
			const { error: insertError } = await supabase.from("fraud_signals").upsert(
				{
					rule: signal.rule,
					target_id: signal.target_id,
					target_type: signal.target_type,
					details: signal.details,
					detected_at: new Date().toISOString(),
					status: "pending_review",
				},
				{ onConflict: "rule,target_id" },
			);

			if (!insertError) inserted++;
		} catch (err) {
			errors.push(`Insert error: ${String(err)}`);
		}
	}

	return new Response(
		JSON.stringify({
			ok: true,
			signals_found: signals.length,
			signals_inserted: inserted,
			errors,
		}),
		{ headers: { "Content-Type": "application/json" } },
	);
});
