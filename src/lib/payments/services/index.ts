// ============================================================================
// Payments — Server Barrel
// ============================================================================
//
// The single seam the rest of the server calls. `processPayment` dispatches to
// the right adapter; `cardProvider` lets UI report whether Card is backed by
// real Stripe test mode or the simulator. Import this only from server code
// (services, route handlers) — it is "server-only".

import "server-only";

import type { PaymentInput, PaymentResult } from "@/lib/payments";
import { processSandboxPayment } from "./_sandbox";
import { isStripeConfigured, processStripePayment } from "./_stripe";

/** Whether Card payments are processed by real Stripe test mode or the sandbox. */
export function cardProvider(): "stripe" | "sandbox" {
	return isStripeConfigured() ? "stripe" : "sandbox";
}

/**
 * Process a payment through the appropriate adapter.
 * - COD: pay-on-delivery — nothing is charged; returns a synthetic ref.
 * - Card: real Stripe test mode when configured, else the sandbox.
 * - JazzCash / EasyPaisa: always the sandbox (no live gateway available).
 */
export async function processPayment(input: PaymentInput): Promise<PaymentResult> {
	if (input.method === "cod") {
		return { ok: true, ref: `cod_${Date.now().toString(36)}`, provider: "cod" };
	}

	if (input.method === "card" && isStripeConfigured()) {
		return processStripePayment(input);
	}

	return processSandboxPayment(input);
}
