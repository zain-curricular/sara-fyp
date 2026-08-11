// ============================================================================
// Favorites & Recent Views — Services
// ============================================================================
//
// Server-only data access for the buyer's saved listings and view history.
//
// These read Supabase directly rather than calling /api/favorites/me and
// /api/me/recent-views over HTTP. A server-to-server fetch carries no browser
// cookies, and those routes authenticate via `authenticateRequest()`, which is
// cookie-based — so the call always came back 401 and the page bounced a
// signed-in user to /login. The API routes remain for client-side callers.

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { FavoritesListPayload, ViewedListPayload } from "@/lib/features/favorites/types";

/** Caps the page size a caller can request, mirroring the API routes. */
const MAX_LIMIT = 100;

function toRange(page: number, limit: number): { limit: number; offset: number } {
	const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
	const safePage = Math.max(1, page);

	return { limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/** The authenticated user's saved listings, newest-first. */
export async function getFavoritesForUser(
	userId: string,
	page = 1,
	limit = 24,
): Promise<{ data: FavoritesListPayload | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { limit: safeLimit, offset } = toRange(page, limit);

	const { count } = await supabase
		.from("favorites")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId);

	const { data: rows, error } = await supabase
		.from("favorites")
		.select("created_at, listings (*)")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.range(offset, offset + safeLimit - 1);

	if (error) return { data: null, error };

	const items = (rows ?? []).map((row) => ({
		listing: (row as Record<string, unknown>).listings,
		favorited_at: (row as Record<string, unknown>).created_at as string,
	})) as FavoritesListPayload["items"];

	const total = count ?? 0;

	return {
		data: {
			items,
			pagination: { total, limit: safeLimit, offset, hasMore: offset + items.length < total },
		},
		error: null,
	};
}

/** The authenticated user's recently viewed listings, newest-first. */
export async function getViewedListingsForUser(
	userId: string,
	page = 1,
	limit = 24,
): Promise<{ data: ViewedListPayload | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();
	const { limit: safeLimit, offset } = toRange(page, limit);

	const { count } = await supabase
		.from("viewed_listings")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId);

	const { data: rows, error } = await supabase
		.from("viewed_listings")
		.select("viewed_at, listings (*)")
		.eq("user_id", userId)
		.order("viewed_at", { ascending: false })
		.range(offset, offset + safeLimit - 1);

	if (error) return { data: null, error };

	const items = (rows ?? []).map((row) => ({
		listing: (row as Record<string, unknown>).listings,
		viewed_at: (row as Record<string, unknown>).viewed_at as string,
	})) as ViewedListPayload["items"];

	const total = count ?? 0;

	return {
		data: {
			items,
			pagination: { total, limit: safeLimit, offset, hasMore: offset + items.length < total },
		},
		error: null,
	};
}
