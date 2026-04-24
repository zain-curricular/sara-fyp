// ============================================================================
// GET /api/auth/callback
// ============================================================================
//
// OAuth callback handler for Supabase Auth (Google OAuth etc.).
// Supabase redirects here with ?code=... after the user authorises.
// Exchanges the code for a session, sets the session cookies, then redirects
// the user to ?next= or the buyer dashboard.
//
// This route must be set as the redirect URI in:
//   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams, origin } = request.nextUrl;
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/buyer";

	if (!code) {
		return NextResponse.redirect(new URL("/login?error=no_code", origin));
	}

	const supabase = await createServerSupabaseClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		console.error("[GET /api/auth/callback]", error);
		return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin));
	}

	// Redirect to the intended destination (or buyer dashboard)
	const destination = next.startsWith("/") ? next : "/buyer";
	return NextResponse.redirect(new URL(destination, origin));
}
