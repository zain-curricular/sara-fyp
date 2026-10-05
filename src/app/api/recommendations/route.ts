// ============================================================================
// POST /api/recommendations
// ============================================================================
//
// Live recommendation endpoint. Public (guests allowed): the taste profile is
// computed in the browser from recent behaviour and posted on every change.
//
// Flow
// ----
// Validate body (`liveRecommendationsRequestSchema`) → delegate to
// `getLiveRecommendations` → respond `{ ok, data }` with `Cache-Control:
// no-store` (results are per-shopper and change on every interaction).

import { NextResponse } from "next/server";

import { liveRecommendationsRequestSchema } from "@/lib/features/recommendations";
import { getLiveRecommendations } from "@/lib/features/recommendations/services";

/**
 * Ranks live recommendations for a browser-computed taste profile.
 */
export async function POST(request: Request) {

	try {

		// 1. Validate
		const body = await request.json().catch(() => ({}));
		const parsed = liveRecommendationsRequestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
				{ status: 400 },
			);
		}

		// 2. Delegate — service already logged if this fails
		const { profile, contextListingId, limit } = parsed.data;
		const { data, error } = await getLiveRecommendations({ profile, contextListingId, limit });
		if (error) {
			return NextResponse.json({ ok: false, error: "Failed to load recommendations" }, { status: 500 });
		}

		// 3. Respond
		return NextResponse.json(
			{ ok: true, data },
			{ status: 200, headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		console.error("UNEXPECTED: POST /api/recommendations", error);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}
