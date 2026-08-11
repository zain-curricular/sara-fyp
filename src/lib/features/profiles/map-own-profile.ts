// ============================================================================
// Own Profile Row Mapper
// ============================================================================
//
// Single source of truth for turning a raw `profiles` row into the OwnProfile
// shape the app consumes. Shared by the RSC loader (fetch-my-profile.ts) and
// the GET/PATCH handlers of /api/profiles/me so the three call sites cannot
// drift apart as columns are added.
//
// Pure function — no server-only import, safe to unit test.

import type { OwnProfile } from "./types";

/** Normalises a raw `profiles` row into the OwnProfile shape, applying defaults. */
export function mapOwnProfileRow(row: Record<string, unknown>): OwnProfile {
	return {
		id: row.id as string,
		role: row.role as OwnProfile["role"],
		display_name: (row.display_name ?? null) as string | null,
		avatar_url: (row.avatar_url ?? null) as string | null,
		phone_number: (row.phone_number ?? null) as string | null,
		phone_verified: (row.phone_verified ?? false) as boolean,
		email: (row.email ?? null) as string | null,
		city: (row.city ?? null) as string | null,
		area: (row.area ?? null) as string | null,
		bio: (row.bio ?? null) as string | null,
		is_verified: (row.is_verified ?? false) as boolean,
		is_banned: (row.is_banned ?? false) as boolean,
		avg_rating: (row.avg_rating ?? 0) as number,
		total_reviews: (row.total_reviews ?? 0) as number,
		total_listings: (row.total_listings ?? 0) as number,
		total_sales: (row.total_sales ?? 0) as number,
		created_at: row.created_at as string,
		updated_at: row.updated_at as string,
		handle: (row.handle ?? null) as string | null,
		onboarding_completed_at: (row.onboarding_completed_at ?? null) as string | null,
		last_seen_at: (row.last_seen_at ?? null) as string | null,
		locale: (row.locale ?? "en") as string,
	};
}
