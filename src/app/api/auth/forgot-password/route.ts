// ============================================================================
// POST /api/auth/forgot-password
// ============================================================================
//
// Triggers a Supabase password-reset email for the given address.
// Intentionally returns ok:true even when the email doesn't exist — this
// prevents user enumeration attacks.
//
// Request body: { email: string }
// Response:
//   { ok: true }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const forgotBody = z.object({
	email: z.string().email("Enter a valid email"),
});

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = forgotBody.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);
	}

	const { email } = parsed.data;
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

	const supabase = await createServerSupabaseClient();
	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${siteUrl}/reset-password`,
	});

	// Always return ok — avoids email enumeration
	return NextResponse.json({ ok: true });
}
