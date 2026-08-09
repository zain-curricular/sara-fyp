// ============================================================================
// Unit tests — Payments seam
// ============================================================================
//
// Covers the deterministic sandbox processor + the seam dispatch (COD, card,
// wallet) and the small helpers. No DB, no network — pure logic. When
// STRIPE_SECRET_KEY is unset (the default in tests), card routes to the sandbox.

import { describe, it, expect } from "vitest";

import {
	defaultInstrument,
	TEST_CARD_SUCCESS,
	TEST_CARD_DECLINE,
} from "@/lib/payments";
import { processPayment, cardProvider } from "@/lib/payments/services";

describe("payments seam", () => {
	it("COD is pay-on-delivery — always ok with a cod provider", async () => {
		const r = await processPayment({ method: "cod", amount: 5000 });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.provider).toBe("cod");
	});

	it("card with the success test number succeeds via the sandbox", async () => {
		const r = await processPayment({ method: "card", amount: 5000, instrument: TEST_CARD_SUCCESS });
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.provider).toBe("sandbox");
			expect(r.ref).toMatch(/^sbx_card_/);
		}
	});

	it("card with the decline test number is declined", async () => {
		const r = await processPayment({ method: "card", amount: 5000, instrument: TEST_CARD_DECLINE });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toMatch(/declined/i);
	});

	it("wallet payment succeeds for a normal number", async () => {
		const r = await processPayment({ method: "jazzcash", amount: 3000, instrument: "03001234567" });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.ref).toMatch(/^sbx_jazzcash_/);
	});

	it("wallet payment fails for a number ending in 00", async () => {
		const r = await processPayment({ method: "easypaisa", amount: 3000, instrument: "03001234500" });
		expect(r.ok).toBe(false);
	});

	it("cardProvider is 'sandbox' when no Stripe key is configured", () => {
		expect(cardProvider()).toBe("sandbox");
	});

	it("defaultInstrument pre-fills the success test card for card", () => {
		expect(defaultInstrument("card")).toBe(TEST_CARD_SUCCESS);
		expect(defaultInstrument("cod")).toBe("");
	});
});
