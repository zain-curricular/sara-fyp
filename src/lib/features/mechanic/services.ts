// ============================================================================
// Mechanic — Services
// ============================================================================
//
// Server-only business logic for the mechanic flow. Handles profile management,
// request queuing (filtered by service area), request acceptance, and verdict
// submission. All functions return { data, error } — never throw.
//
// Architecture
// ------------
// - `getMechanicProfile`      → fetches mechanics row joined with profiles
// - `upsertMechanicProfile`   → creates/updates mechanics row, grants role
// - `listPendingRequests`     → pool of open requests within mechanic's areas
// - `listAssignedRequests`    → requests assigned to this mechanic
// - `listCompletedRequests`   → completed verifications for this mechanic
// - `acceptRequest`           → atomically assigns mechanic + notifies buyer
// - `submitVerdict`           → records verdict + notifies buyer

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import type {
	MechanicProfile,
	MechanicVerificationRequest,
	VerificationVerdict,
} from "./types";

// ----------------------------------------------------------------------------
// Get profile
// ----------------------------------------------------------------------------

/** Fetch a mechanic's full profile including base profile fields. */
export async function getMechanicProfile(
	mechanicId: string,
): Promise<{ data: MechanicProfile | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("mechanics")
		.select(
			`id, specialties, service_areas, hourly_rate, verified_at, total_jobs, rating,
			 profiles!inner(full_name, avatar_url, city)`,
		)
		.eq("id", mechanicId)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!data) return { data: null, error: null };

	const profile = data.profiles as unknown as {
		full_name: string | null;
		avatar_url: string | null;
		city: string | null;
	};

	return {
		data: {
			id: data.id as string,
			specialties: (data.specialties as string[]) ?? [],
			serviceAreas: (data.service_areas as string[]) ?? [],
			hourlyRate: (data.hourly_rate as number) ?? 0,
			verifiedAt: data.verified_at as string | null,
			totalJobs: (data.total_jobs as number) ?? 0,
			rating: data.rating as number | null,
			profile: {
				fullName: profile?.full_name ?? null,
				avatarUrl: profile?.avatar_url ?? null,
				city: profile?.city ?? null,
			},
		},
		error: null,
	};
}

// ----------------------------------------------------------------------------
// Upsert profile
// ----------------------------------------------------------------------------

/**
 * Creates or updates a mechanic profile and grants the 'mechanic' role.
 * Uses service-role client so it can write the roles array safely.
 */
export async function upsertMechanicProfile(
	userId: string,
	data: {
		specialties: string[];
		serviceAreas: string[];
		hourlyRate: number;
	},
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	// Upsert mechanics row
	const { error: mechError } = await admin.from("mechanics").upsert(
		{
			id: userId,
			specialties: data.specialties,
			service_areas: data.serviceAreas,
			hourly_rate: data.hourlyRate,
			total_jobs: 0,
		},
		{ onConflict: "id" },
	);

	if (mechError) return { error: mechError };

	// Grant mechanic role (array_append only if not already present)
	const { error: roleError } = await admin.rpc("grant_role", {
		p_user_id: userId,
		p_role: "mechanic",
	});

	// If RPC doesn't exist, fall back to manual update
	if (roleError) {
		const { data: existing } = await admin
			.from("profiles")
			.select("roles")
			.eq("id", userId)
			.maybeSingle();

		const currentRoles = (existing?.roles as string[]) ?? ["buyer"];
		const newRoles = currentRoles.includes("mechanic")
			? currentRoles
			: [...currentRoles, "mechanic"];

		const { error: updateError } = await admin
			.from("profiles")
			.update({ roles: newRoles })
			.eq("id", userId);

		if (updateError) return { error: updateError };
	}

	return { error: null };
}

// ----------------------------------------------------------------------------
// List requests
// ----------------------------------------------------------------------------

/** Pool of pending verification requests within mechanic's service areas. */
export async function listPendingRequests(mechanicId: string): Promise<{
	data: MechanicVerificationRequest[];
	error: unknown;
}> {
	const supabase = await createServerSupabaseClient();

	// Get mechanic's service areas first
	const { data: mechanic } = await supabase
		.from("mechanics")
		.select("service_areas")
		.eq("id", mechanicId)
		.maybeSingle();

	const serviceAreas = (mechanic?.service_areas as string[]) ?? [];

	const { data, error } = await supabase
		.from("verification_requests")
		.select(
			`id, buyer_id, listing_id, mechanic_id, status, verdict, notes, buyer_notes, responded_at, created_at,
			 listings!inner(title, price, city, listing_images(url, position)),
			 part_categories(name)`,
		)
		.eq("status", "pending")
		.is("mechanic_id", null)
		.in("listings.city", serviceAreas.length > 0 ? serviceAreas : ["__none__"])
		.order("created_at", { ascending: false })
		.limit(50);

	if (error) return { data: [], error };

	return { data: mapRequests(data ?? []), error: null };
}

/** Requests currently assigned to this mechanic (status=assigned). */
export async function listAssignedRequests(mechanicId: string): Promise<{
	data: MechanicVerificationRequest[];
	error: unknown;
}> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("verification_requests")
		.select(
			`id, buyer_id, listing_id, mechanic_id, status, verdict, notes, buyer_notes, responded_at, created_at,
			 listings!inner(title, price, city, listing_images(url, position))`,
		)
		.eq("mechanic_id", mechanicId)
		.eq("status", "assigned")
		.order("created_at", { ascending: false });

	if (error) return { data: [], error };

	return { data: mapRequests(data ?? []), error: null };
}

/** Completed verifications for this mechanic. */
export async function listCompletedRequests(mechanicId: string): Promise<{
	data: MechanicVerificationRequest[];
	error: unknown;
}> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("verification_requests")
		.select(
			`id, buyer_id, listing_id, mechanic_id, status, verdict, notes, buyer_notes, responded_at, created_at,
			 listings!inner(title, price, city, listing_images(url, position))`,
		)
		.eq("mechanic_id", mechanicId)
		.eq("status", "completed")
		.order("responded_at", { ascending: false })
		.limit(100);

	if (error) return { data: [], error };

	return { data: mapRequests(data ?? []), error: null };
}

// ----------------------------------------------------------------------------
// Accept request
// ----------------------------------------------------------------------------

/**
 * Atomically assigns this mechanic to a pending request.
 * Sends a notification to the buyer.
 */
export async function acceptRequest(
	mechanicId: string,
	requestId: string,
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	// Fetch request to get buyer_id
	const { data: req, error: fetchError } = await admin
		.from("verification_requests")
		.select("id, buyer_id, status, listing_id")
		.eq("id", requestId)
		.eq("status", "pending")
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!req) return { error: new Error("Request not found or already assigned") };

	// Assign mechanic
	const { error: updateError } = await admin
		.from("verification_requests")
		.update({ mechanic_id: mechanicId, status: "assigned" })
		.eq("id", requestId)
		.eq("status", "pending");

	if (updateError) return { error: updateError };

	// Notify buyer
	await admin.from("notifications").insert({
		user_id: req.buyer_id,
		type: "order_status",
		title: "Mechanic assigned",
		body: "A mechanic has accepted your part verification request.",
		entity_type: "verification_request",
		entity_id: requestId,
	});

	return { error: null };
}

// ----------------------------------------------------------------------------
// Submit verdict
// ----------------------------------------------------------------------------

/**
 * Records the mechanic's verdict on a verification request.
 * Updates status to 'completed' and notifies the buyer.
 */
export async function submitVerdict(
	mechanicId: string,
	requestId: string,
	verdict: VerificationVerdict,
	notes: string,
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	const { data: req, error: fetchError } = await admin
		.from("verification_requests")
		.select("id, buyer_id, status, mechanic_id")
		.eq("id", requestId)
		.eq("mechanic_id", mechanicId)
		.eq("status", "assigned")
		.maybeSingle();

	if (fetchError) return { error: fetchError };
	if (!req) return { error: new Error("Request not found or not assigned to you") };

	const { error: updateError } = await admin
		.from("verification_requests")
		.update({
			verdict,
			notes,
			status: "completed",
			responded_at: new Date().toISOString(),
		})
		.eq("id", requestId);

	if (updateError) return { error: updateError };

	// Increment mechanic's total_jobs
	await admin.rpc("increment_mechanic_jobs", { p_mechanic_id: mechanicId });

	// Notify buyer
	const verdictLabel =
		verdict === "verified_compatible"
			? "Compatible"
			: verdict === "verified_incompatible"
				? "Incompatible"
				: "Insufficient info";

	await admin.from("notifications").insert({
		user_id: req.buyer_id,
		type: "order_status",
		title: "Verification complete",
		body: `Mechanic verdict: ${verdictLabel}. View the full report for details.`,
		entity_type: "verification_request",
		entity_id: requestId,
	});

	return { error: null };
}

// ----------------------------------------------------------------------------
// Internal mapper
// ----------------------------------------------------------------------------

function mapRequests(rows: unknown[]): MechanicVerificationRequest[] {
	return (rows as Record<string, unknown>[]).map((row) => {
		const listing = row.listings as Record<string, unknown> | null;
		const images = (listing?.listing_images as { url: string; position: number }[]) ?? [];
		const firstImage = images.sort((a, b) => a.position - b.position)[0] ?? null;

		return {
			id: row.id as string,
			buyerId: row.buyer_id as string,
			listingId: row.listing_id as string,
			mechanicId: row.mechanic_id as string | null,
			status: row.status as MechanicVerificationRequest["status"],
			verdict: row.verdict as VerificationVerdict | null,
			notes: row.notes as string | null,
			buyerNotes: row.buyer_notes as string | null,
			respondedAt: row.responded_at as string | null,
			createdAt: row.created_at as string,
			listing: listing
				? {
						title: listing.title as string,
						price: listing.price as number,
						city: listing.city as string,
						imageUrl: firstImage?.url ?? null,
						category: null,
					}
				: null,
			vehicle: null,
		};
	});
}
