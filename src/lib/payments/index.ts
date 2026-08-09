// ============================================================================
// Payments — Client Barrel (types, test constants)
// ============================================================================
//
// Public, client-safe surface for the payments seam. The actual processing
// lives behind the server barrel (./services). Checkout imports these types +
// the magic test values to render hints; it never imports the processors.
//
// Seam design
// -----------
// One interface — processPayment(input) -> PaymentResult — with two adapters
// behind it: a real Stripe test-mode adapter (server-side PaymentIntents) that
// activates when STRIPE_SECRET_KEY is set, and a deterministic in-repo sandbox
// otherwise. COD is pay-on-delivery and is never charged up front. This lets a
// real gateway replace the simulator without touching checkout or orders.

/** Payment methods offered at checkout. */
export type PaymentMethod = "cod" | "jazzcash" | "easypaisa" | "card";

/** Which backend actually processed a payment. */
export type PaymentProvider = "stripe" | "sandbox" | "cod";

/** Input to the payments seam. `instrument` is the card number (card) or the
 *  mobile-wallet number (jazzcash/easypaisa); ignored for COD. */
export type PaymentInput = {
	method: PaymentMethod;
	amount: number; // PKR, whole rupees
	instrument?: string;
};

/** Result of processing a payment. `ref` is the gateway reference (Stripe
 *  PaymentIntent id, or a synthetic sandbox/COD ref). */
export type PaymentResult =
	| { ok: true; ref: string; provider: PaymentProvider }
	| { ok: false; reason: string };

// ----------------------------------------------------------------------------
// Magic test values (shared by the sandbox and the Stripe test-method mapping)
// ----------------------------------------------------------------------------

/** Card number that always succeeds (Stripe's canonical test Visa). */
export const TEST_CARD_SUCCESS = "4242424242424242";

/** Card number that always declines. */
export const TEST_CARD_DECLINE = "4000000000000002";

/** Wallet numbers ending in this suffix are declined by the sandbox. */
export const TEST_WALLET_FAIL_SUFFIX = "00";

/** Default pre-filled instrument per method, so the demo works out of the box. */
export function defaultInstrument(method: PaymentMethod): string {
	if (method === "card") return TEST_CARD_SUCCESS;
	if (method === "jazzcash" || method === "easypaisa") return "03001234567";
	return "";
}
