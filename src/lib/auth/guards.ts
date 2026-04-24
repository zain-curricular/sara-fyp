// ============================================================================
// Auth Guards & Role Helpers
// ============================================================================
//
// Server-side auth utilities for route handlers and server components.
// All functions return structured results — they never throw.

import "server-only";

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthResult =
	| { ok: true; userId: string; roles: string[]; activeRole: string }
	| { ok: false; error: NextResponse };

/** Authenticate from an incoming Request (route handler). */
export async function authenticateRequest(): Promise<AuthResult> {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return {
			ok: false,
			error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
		};
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("roles, active_role")
		.eq("id", user.id)
		.maybeSingle();

	return {
		ok: true,
		userId: user.id,
		roles: (profile?.roles as string[]) ?? ["buyer"],
		activeRole: (profile?.active_role as string) ?? "buyer",
	};
}

/** Require a specific role. Returns 403 if the user lacks it. */
export async function requireRole(role: string): Promise<AuthResult> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth;

	if (!auth.roles.includes(role)) {
		return {
			ok: false,
			error: NextResponse.json(
				{ ok: false, error: `Role '${role}' required` },
				{ status: 403 },
			),
		};
	}

	return auth;
}

/** Get the current user's profile from a Server Component (no route context needed). */
export async function getServerSession(): Promise<{
	userId: string;
	roles: string[];
	activeRole: string;
} | null> {
	try {
		const supabase = await createServerSupabaseClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return null;

		const { data: profile } = await supabase
			.from("profiles")
			.select("roles, active_role, full_name, avatar_url")
			.eq("id", user.id)
			.maybeSingle();

		return {
			userId: user.id,
			roles: (profile?.roles as string[]) ?? ["buyer"],
			activeRole: (profile?.active_role as string) ?? "buyer",
		};
	} catch {
		return null;
	}
}

/** Redirect to /login with ?next= if not authenticated. For use in page.tsx. */
export function loginRedirect(next: string) {
	const url = `/login?next=${encodeURIComponent(next)}`;
	const { redirect } = require("next/navigation");
	redirect(url);
}

/** Redirect to /403 if role missing. For use in page.tsx. */
export function forbiddenRedirect() {
	const { redirect } = require("next/navigation");
	redirect("/403");
}
