// ============================================================================
// GET /api/profiles/[id]
// ============================================================================
//
// Public profile fetch — no auth required. Returns PublicProfile shape
// (excludes sensitive fields: email, phone, is_banned).
//
// Cached for 60s via Next.js fetch cache on the RSC side (fetchPublicProfile).
//
// Response shape:
//   { ok: true, data: PublicProfile }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ ok: false, error: "Missing profile id" }, { status: 400 });
	}

	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("profiles")
		.select(
			"id, role, display_name, avatar_url, phone_verified, city, area, bio, is_verified, avg_rating, total_reviews, total_listings, total_sales, created_at, updated_at, handle, onboarding_completed_at, last_seen_at, locale",
		)
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("[GET /api/profiles/[id]]", error);
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
			phone_verified: row.phone_verified ?? false,
			city: row.city ?? null,
			area: row.area ?? null,
			bio: row.bio ?? null,
			is_verified: row.is_verified ?? false,
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
