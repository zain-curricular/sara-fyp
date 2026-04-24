// ============================================================================
// POST /api/auth/switch-role
// ============================================================================
//
// Switches the authenticated user's active_role in the profiles table.
// Only allows switching to a role the user already holds — not a privilege
// escalation endpoint.
//
// Request body: { role: string }
// Response:
//   { ok: true }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const switchRoleBody = z.object({
	role: z.string().min(1, "Role is required"),
});

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
	// Authenticate
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	// Parse body
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = switchRoleBody.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);
	}

	const { role } = parsed.data;

	// Verify the user actually holds this role
	if (!auth.roles.includes(role)) {
		return NextResponse.json(
			{ ok: false, error: `You do not hold the '${role}' role` },
			{ status: 403 },
		);
	}

	// Update active_role
	const supabase = await createServerSupabaseClient();
	const { error } = await supabase
		.from("profiles")
		.update({ active_role: role })
		.eq("id", auth.userId);

	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to switch role" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
