import "server-only";

import { apiFetch, ApiError } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { ApiEnvelope, OwnProfile } from "./types";

/** `null` = no session or 401; `"no_profile"` = session ok but no profile row yet (API 404). */
export type FetchMyProfileResult = OwnProfile | null | "no_profile";

/** Authenticated GET /api/profiles/me for RSC. */
export async function fetchMyProfile(): Promise<FetchMyProfileResult> {
	const supabase = await createServerSupabaseClient();

	// getUser() re-validates the JWT with the auth server — safe for server-side auth checks.
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return null;

	// getSession() is still needed for the bearer token; we don't read session.user here.
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session?.access_token) {
		return null;
	}

	try {
		const body = await apiFetch<ApiEnvelope<OwnProfile>>("/api/profiles/me", {
			accessToken: session.access_token,
		});
		if (!body.ok || !("data" in body) || !body.data) {
			throw new Error("Profile unavailable");
		}
		return body.data;
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			return null;
		}
		if (e instanceof ApiError && e.status === 404) {
			return "no_profile";
		}
		throw e;
	}
}
