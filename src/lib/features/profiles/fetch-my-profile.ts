// ============================================================================
// Fetch My Profile (RSC)
// ============================================================================
//
// Loads the signed-in user's own profile for Server Components.
//
// Why No HTTP Hop
// ---------------
// This used to self-fetch GET /api/profiles/me with an `Authorization: Bearer`
// header. That route authenticates from the *cookie* store (createServerClient
// reads next/headers cookies), and a server-to-server fetch carries no cookies,
// so every call 401'd and bounced signed-in users to /login. Reading Supabase
// directly is also what every other authenticated RSC page here does.
//
// Result Contract
// ---------------
// `null`         — no session; caller should redirect to login.
// `"no_profile"` — session valid but no profiles row yet; caller sends to onboarding.
// `OwnProfile`   — the profile.
//
// A genuine query failure throws so error.tsx can offer a retry, rather than
// misreporting a signed-in user as logged out.

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { mapOwnProfileRow } from "./map-own-profile";
import type { OwnProfile } from "./types";

/** `null` = no session; `"no_profile"` = session ok but no profile row yet. */
export type FetchMyProfileResult = OwnProfile | null | "no_profile";

/** Loads the authenticated user's own profile from a Server Component. */
export async function fetchMyProfile(): Promise<FetchMyProfileResult> {
	const supabase = await createServerSupabaseClient();

	// Authoritative session check — getUser() validates the token with Supabase
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;

	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.maybeSingle();

	if (error) {
		console.error("[fetchMyProfile]", error);
		throw new Error("Failed to load profile");
	}

	if (!data) return "no_profile";

	return mapOwnProfileRow(data as Record<string, unknown>);
}
