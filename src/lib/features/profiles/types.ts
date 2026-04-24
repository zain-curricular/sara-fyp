/**
 * API-facing profile shapes (mirror `src/lib/features/profiles/types.ts` in the backend app).
 */

/** Public seller/buyer card — excludes email, phone, ban flag. */
export type PublicProfile = {
	id: string;
	role: "user" | "seller" | "tester" | "admin";
	display_name: string | null;
	avatar_url: string | null;
	phone_verified: boolean;
	city: string | null;
	area: string | null;
	bio: string | null;
	is_verified: boolean;
	avg_rating: number;
	total_reviews: number;
	total_listings: number;
	total_sales: number;
	created_at: string;
	updated_at: string;
	handle: string | null;
	onboarding_completed_at: string | null;
	last_seen_at: string | null;
	locale: string;
};

/** Full row returned by GET /api/profiles/me (authenticated). */
export type OwnProfile = {
	id: string;
	role: "user" | "seller" | "tester" | "admin";
	display_name: string | null;
	avatar_url: string | null;
	phone_number: string | null;
	phone_verified: boolean;
	email: string | null;
	city: string | null;
	area: string | null;
	bio: string | null;
	is_verified: boolean;
	is_banned: boolean;
	avg_rating: number;
	total_reviews: number;
	total_listings: number;
	total_sales: number;
	created_at: string;
	updated_at: string;
	handle: string | null;
	onboarding_completed_at: string | null;
	last_seen_at: string | null;
	locale: string;
};

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiEnvelope<T> = ApiOk<T> | ApiErr;
