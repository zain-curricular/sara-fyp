// ============================================================================
// GET|PATCH /api/profiles/me
// ============================================================================
//
// GET  — returns the authenticated user's own full profile (OwnProfile shape).
// PATCH — updates user-editable profile fields (display_name, city, bio, etc.)
//
// Both require a valid session cookie (cookie-based SSR auth).
//
// Response shape:
//   { ok: true, data: OwnProfile }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateOwnProfileSchema } from "@/lib/features/profiles/schemas";

// ----------------------------------------------------------------------------
// GET — fetch own profile
// ----------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", auth.userId)
		.maybeSingle();

	if (error) {
		console.error("[GET /api/profiles/me]", error);
		return NextResponse.json({ ok: false, error: "Failed to load profile" }, { status: 500 });
	}

	if (!data) {
		return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
	}

	const row = data as Record<string, unknown>;

	return NextResponse.json({
		ok: true,
		data: {
			id: row.id,
			role: row.role,
			display_name: row.display_name ?? null,
			avatar_url: row.avatar_url ?? null,
			phone_number: row.phone_number ?? null,
			phone_verified: row.phone_verified ?? false,
			email: row.email ?? null,
			city: row.city ?? null,
			area: row.area ?? null,
			bio: row.bio ?? null,
			is_verified: row.is_verified ?? false,
			is_banned: row.is_banned ?? false,
			avg_rating: row.avg_rating ?? 0,
			total_reviews: row.total_reviews ?? 0,
			total_listings: row.total_listings ?? 0,
			total_sales: row.total_sales ?? 0,
			created_at: row.created_at,
			updated_at: row.updated_at,
			handle: row.handle ?? null,
			onboarding_completed_at: row.onboarding_completed_at ?? null,
			last_seen_at: row.last_seen_at ?? null,
			locale: row.locale ?? "en",
		},
	});
}

// ----------------------------------------------------------------------------
// PATCH — update own profile
// ----------------------------------------------------------------------------

export async function PATCH(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = updateOwnProfileSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	// Map camelCase input fields to snake_case DB columns
	const updates = parsed.data;
	const patch: Record<string, unknown> = {};
	if (updates.display_name !== undefined) patch.display_name = updates.display_name ?? null;
	if (updates.avatar_url !== undefined) patch.avatar_url = updates.avatar_url ?? null;
	if (updates.phone_number !== undefined) patch.phone_number = updates.phone_number ?? null;
	if (updates.city !== undefined) patch.city = updates.city ?? null;
	if (updates.area !== undefined) patch.area = updates.area ?? null;
	if (updates.bio !== undefined) patch.bio = updates.bio ?? null;
	if (updates.handle !== undefined) patch.handle = updates.handle ?? null;
	if (updates.locale !== undefined) patch.locale = updates.locale;

	if (Object.keys(patch).length === 0) {
		return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
	}

	const supabase = await createServerSupabaseClient();

	// Check handle uniqueness if changing it
	if (patch.handle) {
		const { data: existing } = await supabase
			.from("profiles")
			.select("id")
			.eq("handle", patch.handle as string)
			.neq("id", auth.userId)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ ok: false, error: "Handle already taken" }, { status: 409 });
		}
	}

	const { error } = await supabase
		.from("profiles")
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq("id", auth.userId);

	if (error) {
		console.error("[PATCH /api/profiles/me]", error);
		return NextResponse.json({ ok: false, error: "Failed to update profile" }, { status: 500 });
	}

	// Re-fetch and return updated profile
	const { data: updated } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", auth.userId)
		.maybeSingle();

	const row = (updated ?? {}) as Record<string, unknown>;

	return NextResponse.json({
		ok: true,
		data: {
			id: row.id,
			role: row.role,
			display_name: row.display_name ?? null,
			avatar_url: row.avatar_url ?? null,
			phone_number: row.phone_number ?? null,
			phone_verified: row.phone_verified ?? false,
			email: row.email ?? null,
			city: row.city ?? null,
			area: row.area ?? null,
			bio: row.bio ?? null,
			is_verified: row.is_verified ?? false,
			is_banned: row.is_banned ?? false,
			avg_rating: row.avg_rating ?? 0,
			total_reviews: row.total_reviews ?? 0,
			total_listings: row.total_listings ?? 0,
			total_sales: row.total_sales ?? 0,
			created_at: row.created_at,
			updated_at: row.updated_at,
			handle: row.handle ?? null,
			onboarding_completed_at: row.onboarding_completed_at ?? null,
			last_seen_at: row.last_seen_at ?? null,
			locale: row.locale ?? "en",
		},
	});
}
