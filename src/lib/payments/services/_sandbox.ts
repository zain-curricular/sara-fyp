// ============================================================================
// Payments — Sandbox Processor (deterministic, offline)
// ============================================================================
//
// In-repo simulated gateway. Deterministic outcomes from magic values so the
// demo and tests are reproducible with no external account:
//   - Card: TEST_CARD_DECLINE declines; anything else succeeds.
//   - Wallet (jazzcash/easypaisa): numbers ending in TEST_WALLET_FAIL_SUFFIX
//     decline; anything else succeeds.
// A short latency is simulated so the checkout interstitial is visible.

import "server-only";

import type { PaymentInput, PaymentResult } from "@/lib/payments";
import { TEST_CARD_DECLINE, TEST_WALLET_FAIL_SUFFIX } from "@/lib/payments";

// Simulated processing latency (ms).
const LATENCY_MS = 600;

async function simulateLatency(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
}

function syntheticRef(prefix: string): string {
	return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Process a card / wallet payment against the deterministic sandbox. */
export async function processSandboxPayment(input: PaymentInput): Promise<PaymentResult> {
	await simulateLatency();

	const instrument = (input.instrument ?? "").replace(/\s+/g, "");

	if (input.method === "card") {
		if (instrument === TEST_CARD_DECLINE) {
			return { ok: false, reason: "Card declined (test card 4000 0000 0000 0002)." };
		}
		return { ok: true, ref: syntheticRef("sbx_card"), provider: "sandbox" };
	}

	// Wallet methods: jazzcash / easypaisa.
	if (instrument.endsWith(TEST_WALLET_FAIL_SUFFIX)) {
		return { ok: false, reason: "Wallet payment failed — insufficient balance (test)." };
	}
	return { ok: true, ref: syntheticRef(`sbx_${input.method}`), provider: "sandbox" };
}
