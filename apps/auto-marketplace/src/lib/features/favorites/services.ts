import "server-only";

import { apiFetch, ApiError } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { favoritesAndViewsQuery } from "@/lib/features/favorites/query";
import type { FavoritesListPayload, ViewedListPayload } from "@/lib/features/favorites/types";

type FavoritesMeResponse =
	| { ok: true; data: FavoritesListPayload["items"]; pagination: FavoritesListPayload["pagination"] }
	| { ok: false; error: string };

type RecentViewsResponse =
	| { ok: true; data: ViewedListPayload["items"]; pagination: ViewedListPayload["pagination"] }
	| { ok: false; error: string };

/** Authenticated GET /api/favorites/me for RSC. Returns `null` if no session or 401. */
export async function fetchMyFavorites(
	page = 1,
	limit = 24,
): Promise<FavoritesListPayload | null> {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return null;

	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) return null;

	try {
		const qs = favoritesAndViewsQuery(page, limit);
		const body = await apiFetch<FavoritesMeResponse>(`/api/favorites/me${qs}`, {
			accessToken: session.access_token,
		});
		if (!body.ok || !("data" in body)) throw new Error("Favorites unavailable");
		return { items: body.data, pagination: body.pagination };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) return null;
		throw e;
	}
}

/** Authenticated GET /api/me/recent-views for RSC. Returns `null` if no session or 401. */
export async function fetchMyViewedListings(
	page = 1,
	limit = 24,
): Promise<ViewedListPayload | null> {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return null;

	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) return null;

	try {
		const qs = favoritesAndViewsQuery(page, limit);
		const body = await apiFetch<RecentViewsResponse>(`/api/me/recent-views${qs}`, {
			accessToken: session.access_token,
		});
		if (!body.ok || !("data" in body)) throw new Error("Recent views unavailable");
		return { items: body.data, pagination: body.pagination };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) return null;
		throw e;
	}
}
