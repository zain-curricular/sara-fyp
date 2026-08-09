// ============================================================================
// PATCH /api/seller/payout — save the seller's validated payout details
// ============================================================================
//
// Writes bank/wallet details to seller_stores.payout_details (jsonb), replacing
// the old unvalidated profiles.metadata path. Having non-null payout_details is
// one of the gates enforced at listing publish (Phase 2.2).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Method-aware validation: bank needs an IBAN-ish account + bank name; wallets
// need an 03xx mobile number.
const payoutSchema = z
	.object({
		method: z.enum(["bank_transfer", "jazzcash", "easypaisa"]),
		accountTitle: z.string().min(2, "Account title is required"),
		accountNumber: z.string().min(6, "Account / wallet number is required"),
		bankName: z.string().optional().default(""),
	})
	.refine((d) => d.method !== "bank_transfer" || d.bankName.trim().length > 0, {
		message: "Bank name is required for bank transfer",
		path: ["bankName"],
	})
	.refine(
		(d) =>
			d.method === "bank_transfer"
				? /^[A-Z0-9]{10,34}$/.test(d.accountNumber.replace(/\s+/g, "").toUpperCase())
				: /^0?3\d{9,10}$/.test(d.accountNumber.replace(/[\s-]/g, "")),
		{
			message: "Enter a valid IBAN/account (bank) or 03xx mobile number (wallet)",
			path: ["accountNumber"],
		},
	);

export async function PATCH(req: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	if (!auth.roles.includes("seller")) {
		return NextResponse.json({ ok: false, error: "Seller role required" }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = payoutSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const supabase = await createServerSupabaseClient();
	const { error } = await supabase
		.from("seller_stores")
		.update({ payout_details: parsed.data })
		.eq("owner_id", auth.userId);

	if (error) {
		console.error("[PATCH /api/seller/payout]", error);
		return NextResponse.json({ ok: false, error: "Failed to save payout details" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
