// ============================================================================
// POST /api/onboarding/phone/send-otp
// ============================================================================
//
// Sends a 6-digit SMS OTP to the given phone number via Supabase Auth.
// Requires the user to be authenticated (session cookie).
//
// Request body:
//   { phone_number: string }   // E.164 format, e.g. "+923001234567"
//
// Response shape:
//   { ok: true, data: { sent: true } }
//   { ok: false, error: string }


import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendPhoneOtpSchema } from "@/lib/features/onboarding/schemas";

// ----------------------------------------------------------------------------
// POST — dispatch SMS OTP via Supabase Auth
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

	const parsed = sendPhoneOtpSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { phone_number } = parsed.data;

	// 3. Delegate to Supabase Auth — sends the SMS
	try {
		const supabase = await createServerSupabaseClient();
		const { error } = await supabase.auth.signInWithOtp({
			phone: phone_number,
			options: { channel: "sms" },
		});

		if (error) {
			return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
		}

		// 4. Respond
		return NextResponse.json({ ok: true, data: { sent: true } });
	} catch (error) {
		console.error("[POST /api/onboarding/phone/send-otp]", error);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
