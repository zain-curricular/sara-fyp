// ============================================================================
// Payments — Stripe Test-Mode Adapter (server-side PaymentIntents)
// ============================================================================
//
// Real Stripe integration for Card, using SERVER-SIDE PaymentIntents confirmed
// with Stripe's shared test PaymentMethods. This deliberately avoids hosted
// Checkout / Elements / webhooks so the existing synchronous checkout flow is
// unchanged — no redirect and no Stripe CLI to babysit during the demo — while
// still making real Stripe API calls visible in the test dashboard.
//
// Activation: only when STRIPE_SECRET_KEY (a `sk_test_...` key) is set. Until
// then processPayment routes Card to the sandbox instead. `stripe` is imported
// dynamically so the module never loads when the key is absent.
//
// Test-card mapping: the card number the buyer typed selects the test
// PaymentMethod — the decline card maps to `pm_card_chargeDeclined`, everything
// else to `pm_card_visa` (success). Currency defaults to USD (test only,
// cosmetic) and is overridable via STRIPE_CURRENCY.

import "server-only";

import type { PaymentInput, PaymentResult } from "@/lib/payments";
import { TEST_CARD_DECLINE } from "@/lib/payments";

/** True when a Stripe secret key is configured. */
export function isStripeConfigured(): boolean {
	return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Map the entered test card number to a Stripe test PaymentMethod id. */
function testPaymentMethod(cardNumber: string): string {
	const n = cardNumber.replace(/\s+/g, "");
	if (n === TEST_CARD_DECLINE) return "pm_card_chargeDeclined";
	return "pm_card_visa";
}

/** Charge a Card payment through Stripe test mode. */
export async function processStripePayment(input: PaymentInput): Promise<PaymentResult> {
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) return { ok: false, reason: "Stripe is not configured." };

	try {
		const Stripe = (await import("stripe")).default;
		const stripe = new Stripe(key);

		const currency = process.env.STRIPE_CURRENCY ?? "usd";

		//.. Create + confirm in one call. `allow_redirects: "never"` keeps this
		//.. synchronous (no 3DS redirect); a declined test method throws below.
		const intent = await stripe.paymentIntents.create({
			amount: Math.max(Math.round(input.amount * 100), 50),
			currency,
			payment_method: testPaymentMethod(input.instrument ?? ""),
			confirm: true,
			automatic_payment_methods: { enabled: true, allow_redirects: "never" },
			description: "ShopSmart order (Stripe test mode)",
		});

		if (intent.status === "succeeded") {
			return { ok: true, ref: intent.id, provider: "stripe" };
		}
		return { ok: false, reason: `Payment not completed (status: ${intent.status}).` };
	} catch (error) {
		//.. Stripe throws StripeCardError for declines; surface its message.
		const reason = error instanceof Error ? error.message : "Card declined.";
		return { ok: false, reason };
	}
}
