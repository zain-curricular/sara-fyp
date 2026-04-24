// ============================================================================
// GET /api/me/recent-views
// ============================================================================
//
// Returns the authenticated user's recently viewed listings, newest-first.
// Backed by the `viewed_listings` table (capped per user by a DB trigger).
// Supports ?page= and ?limit= for pagination.
//
// Response shape:
//   { ok: true, data: ViewedListingRow[], pagination: { total, limit, offset, hasMore } }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { searchParams } = request.nextUrl;
	const page = Math.max(1, Number(searchParams.get("page") ?? 1));
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 24)));
	const offset = (page - 1) * limit;

	const supabase = await createServerSupabaseClient();

	const { count } = await supabase
		.from("viewed_listings")
		.select("id", { count: "exact", head: true })
		.eq("user_id", auth.userId);

	const { data: rows, error } = await supabase
		.from("viewed_listings")
		.select(`
			viewed_at,
			listings (*)
		`)
		.eq("user_id", auth.userId)
		.order("viewed_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("[GET /api/me/recent-views]", error);
		return NextResponse.json({ ok: false, error: "Failed to load recent views" }, { status: 500 });
	}

	const total = count ?? 0;
	const items = (rows ?? []).map((row) => ({
		listing: (row as Record<string, unknown>).listings,
		viewed_at: (row as Record<string, unknown>).viewed_at as string,
	}));

	return NextResponse.json({
		ok: true,
		data: items,
		pagination: {
			total,
			limit,
			offset,
			hasMore: offset + items.length < total,
		},
	});
}
