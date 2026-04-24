// ============================================================================
// GET /api/auth/me
// ============================================================================
//
// Returns the current authenticated user's profile and roles.
// Used by client-side code to resolve post-auth redirect destinations and
// to power the role-switcher component.
//
// Response shape:
//   { ok: true,  data: { userId, roles, activeRole, fullName, avatarUrl } }
//   { ok: false, error: string }  (with 401 status if unauthenticated)

import "server-only";

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
	const supabase = await createServerSupabaseClient();

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("roles, active_role, full_name, avatar_url")
		.eq("id", user.id)
		.maybeSingle();

	return NextResponse.json({
		ok: true,
		data: {
			userId: user.id,
			roles: (profile?.roles as string[]) ?? ["buyer"],
			activeRole: (profile?.active_role as string) ?? "buyer",
			fullName: (profile?.full_name as string | null) ?? null,
			avatarUrl: (profile?.avatar_url as string | null) ?? null,
		},
	});
}
