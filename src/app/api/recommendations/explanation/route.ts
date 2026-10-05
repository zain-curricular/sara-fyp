// ============================================================================
// POST /api/recommendations/explanation
// ============================================================================
//
// One-sentence "what you seem to want" explanation for a taste profile.
// Public (guests allowed). The service calls an LLM (with a deterministic
// rules fallback), so requests are rate limited per client IP before
// delegating.
//
// Flow
// ----
// Rate limit (30/min/IP) → validate body (`tasteExplanationRequestSchema`) →
// delegate to `explainTaste` → respond `{ ok, data }` with `Cache-Control:
// no-store`.

import { NextResponse } from "next/server";

import { tasteExplanationRequestSchema } from "@/lib/features/recommendations";
import { explainTaste } from "@/lib/features/recommendations/services";
import { checkRecommendationsExplanationRateLimit } from "@/lib/ratelimit/recommendations-explanation-ratelimit";
import { getRequestClientIp } from "@/lib/request-ip";

/**
 * Explains a browser-computed taste profile in one short sentence.
 */
export async function POST(request: Request) {

	try {

		// 1. Rate limit — guards the LLM call
		const ip = getRequestClientIp(request) ?? "unknown";
		const rl = await checkRecommendationsExplanationRateLimit(ip);
		if (!rl.allowed) {
			return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
		}

		// 2. Validate
		const body = await request.json().catch(() => ({}));
		const parsed = tasteExplanationRequestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
				{ status: 400 },
			);
		}

		// 3. Delegate — always resolves (rules fallback when the LLM fails)
		const { data } = await explainTaste(parsed.data.profile);

		// 4. Respond
		return NextResponse.json(
			{ ok: true, data },
			{ status: 200, headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		console.error("UNEXPECTED: POST /api/recommendations/explanation", error);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}
