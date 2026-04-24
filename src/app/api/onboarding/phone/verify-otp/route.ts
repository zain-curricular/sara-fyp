// ============================================================================
// POST /api/onboarding/phone/verify-otp
// ============================================================================
//
// Verifies a 6-digit SMS OTP via Supabase Auth and, on success, marks the
// authenticated user's profile as phone-verified (storing the phone number).
// Requires the user to be authenticated (session cookie).
//
// Request body:
//   { phone_number: string, code: string }   // E.164 phone, 6-digit code
//
// Response shape:
//   { ok: true, data: { phone_verified: true } }
//   { ok: false, error: string }


import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyPhoneOtpSchema } from "@/lib/features/onboarding/schemas";

// ----------------------------------------------------------------------------
// POST — verify OTP + flag profile as phone-verified
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
	// 1. Auth — must have a valid session
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	// 2. Parse + validate body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = verifyPhoneOtpSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { phone_number, code } = parsed.data;

	try {
		const supabase = await createServerSupabaseClient();

		// 3. Verify OTP — vague client-facing message, never leak provider details
		const { error: verifyError } = await supabase.auth.verifyOtp({
			phone: phone_number,
			token: code,
			type: "sms",
		});

		if (verifyError) {
			return NextResponse.json(
				{ ok: false, error: "Invalid or expired code" },
				{ status: 400 },
			);
		}

		// 4. Persist the verified phone on the profile row
		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				phone_number,
				phone_verified: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", auth.userId);

		if (updateError) {
			console.error("[POST /api/onboarding/phone/verify-otp]", updateError);
			return NextResponse.json(
				{ ok: false, error: "Failed to update profile" },
				{ status: 500 },
			);
		}

		// 5. Respond
		return NextResponse.json({ ok: true, data: { phone_verified: true } });
	} catch (error) {
		console.error("[POST /api/onboarding/phone/verify-otp]", error);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
