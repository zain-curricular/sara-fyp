// ============================================================================
// POST /api/auth/logout
// ============================================================================
//
// Signs the current user out via Supabase server client, then redirects to /.
// Accepts POST requests (e.g. from a form or fetch). For GET-based logout
// (browser navigation) use the /logout page which is a server component.

import { type NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	const supabase = await createServerSupabaseClient();
	await supabase.auth.signOut();

	// Home on whichever origin the request arrived at. Redirecting to a
	// hardcoded NEXT_PUBLIC_SITE_URL bounced users across hosts (127.0.0.1 →
	// localhost, or a preview domain → production), which reads as a broken
	// logout because the destination host has its own cookie jar.
	return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}
