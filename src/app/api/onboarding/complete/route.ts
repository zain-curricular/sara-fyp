// ============================================================================
// POST /api/onboarding/complete
// ============================================================================
//
// Finalises the onboarding flow for the authenticated user:
//   - Validates and persists profile fields (display_name, city, locale, handle)
//   - Optionally records the phone number if supplied
//   - Stamps onboarding_completed_at + updated_at
//   - Returns the freshly re-fetched profile in the OwnProfile shape
//
// Handle uniqueness is enforced via a pre-check (case-sensitive match against
// the profiles table, scoped to other users).
//
// Request body: see completeOnboardingSchema.
//
// Response shape:
//   { ok: true, data: OwnProfile }
//   { ok: false, error: string }


import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completeOnboardingSchema } from "@/lib/features/onboarding/schemas";

// ----------------------------------------------------------------------------
// POST — complete onboarding
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

	const parsed = completeOnboardingSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const input = parsed.data;

	try {
		const supabase = await createServerSupabaseClient();

		// 3. Handle uniqueness pre-check — only if a handle was provided
		if (input.handle) {
			const { data: existing, error: handleLookupError } = await supabase
				.from("profiles")
				.select("id")
				.eq("handle", input.handle)
				.neq("id", auth.userId)
				.maybeSingle();

			if (handleLookupError) {
				console.error("[POST /api/onboarding/complete] handle lookup", handleLookupError);
				return NextResponse.json(
					{ ok: false, error: "Failed to validate handle" },
					{ status: 500 },
				);
			}

			if (existing) {
				return NextResponse.json(
					{ ok: false, error: "Handle already taken" },
					{ status: 409 },
				);
			}
		}

		// 4. Build patch — only include fields the caller provided
		const now = new Date().toISOString();
		const patch: Record<string, unknown> = {
			display_name: input.display_name,
			city: input.city,
			locale: input.locale,
			onboarding_completed_at: now,
			updated_at: now,
		};

		if (input.handle !== undefined) patch.handle = input.handle;
		if (input.phone_number !== undefined) patch.phone_number = input.phone_number;

		// 5. Apply update
		const { error: updateError } = await supabase
			.from("profiles")
			.update(patch)
			.eq("id", auth.userId);

		if (updateError) {
			console.error("[POST /api/onboarding/complete]", updateError);
			return NextResponse.json(
				{ ok: false, error: "Failed to complete onboarding" },
				{ status: 500 },
			);
		}

		// 6. Re-fetch the full row so the client receives the canonical OwnProfile shape
		const { data: updated, error: fetchError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", auth.userId)
			.maybeSingle();

		if (fetchError || !updated) {
			console.error("[POST /api/onboarding/complete] re-fetch", fetchError);
			return NextResponse.json(
				{ ok: false, error: "Failed to load profile" },
				{ status: 500 },
			);
		}

		const row = updated as Record<string, unknown>;

		// 7. Respond — OwnProfile shape (mirrors GET /api/profiles/me)
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
	} catch (error) {
		console.error("[POST /api/onboarding/complete]", error);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
