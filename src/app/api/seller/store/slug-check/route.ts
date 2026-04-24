// ============================================================================
// GET /api/seller/store/slug-check
// ============================================================================
//
// Checks whether a proposed slug is available.
// Query: ?slug=my-store-slug
// Response: { ok: true, available: boolean }
//
// Does not require auth — slug check is safe as a public read.

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
	const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";

	if (!slug || slug.length < 3 || slug.length > 60) {
		return NextResponse.json(
			{ ok: false, error: "Slug must be 3–60 characters" },
			{ status: 400 },
		);
	}

	if (!SLUG_RE.test(slug)) {
		return NextResponse.json(
			{ ok: false, error: "Slug can only contain lowercase letters, numbers, and hyphens" },
			{ status: 400 },
		);
	}

	const supabase = await createServerSupabaseClient();
	const { data } = await supabase
		.from("seller_stores")
		.select("id")
		.eq("slug", slug)
		.maybeSingle();

	return NextResponse.json({ ok: true, available: !data });
}
