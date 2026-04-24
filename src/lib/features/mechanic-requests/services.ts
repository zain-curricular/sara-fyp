// ============================================================================
// Mechanic Requests — Server Services
// ============================================================================
//
// Server-only functions for mechanic verification request management.
// Requests are stored in mechanic_requests table joined to listings, vehicles,
// and profiles. Fee is currently hardcoded at PKR 500 (platform setting).
//
// Table: mechanic_requests (id, requester_id, listing_id, vehicle_id,
//   vehicle_details, mechanic_id, status, mechanic_notes, fee, paid,
//   created_at, responded_at)

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { MechanicRequest } from "./types";
import type { CreateMechanicRequestInput } from "./schemas";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const VERIFICATION_FEE = 500;

// ----------------------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------------------

function mapRow(row: Record<string, unknown>): MechanicRequest {
	const listing = row.listing as Record<string, unknown> | null;
	const vehicle = row.vehicle as Record<string, unknown> | null;
	const mechanic = row.mechanic as Record<string, unknown> | null;

	return {
		id: row.id as string,
		requesterId: row.requester_id as string,
		listingId: row.listing_id as string,
		vehicleId: row.vehicle_id as string,
		vehicleDetails: (row.vehicle_details as string | null) ?? null,
		mechanicId: (row.mechanic_id as string | null) ?? null,
		status: row.status as MechanicRequest["status"],
		mechanicNotes: (row.mechanic_notes as string | null) ?? null,
		fee: row.fee as number,
		paid: row.paid as boolean,
		createdAt: row.created_at as string,
		respondedAt: (row.responded_at as string | null) ?? null,
		listing: listing
			? {
					title: listing.title as string,
					images: (listing.images as string[]) ?? [],
				}
			: undefined,
		vehicle: vehicle
			? {
					make: vehicle.make as string,
					model: vehicle.model as string,
					yearFrom: vehicle.year_from as number,
					yearTo: vehicle.year_to as number,
				}
			: undefined,
		mechanic: mechanic
			? {
					fullName: mechanic.full_name as string,
					rating: (mechanic.rating as number | null) ?? null,
				}
			: undefined,
	};
}

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

/** Create a new mechanic verification request for a buyer. */
export async function createMechanicRequest(
	requesterId: string,
	input: CreateMechanicRequestInput,
): Promise<{ data: { requestId: string } | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("mechanic_requests")
		.insert({
			requester_id: requesterId,
			listing_id: input.listingId,
			vehicle_id: input.vehicleId,
			vehicle_details: input.notes ?? null,
			status: "pending",
			fee: VERIFICATION_FEE,
			paid: false,
		})
		.select("id")
		.single();

	if (error) return { data: null, error };

	return {
		data: { requestId: (data as Record<string, unknown>).id as string },
		error: null,
	};
}

/** List all mechanic requests created by a buyer. */
export async function listMechanicRequestsForBuyer(
	buyerId: string,
): Promise<{ data: MechanicRequest[]; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("mechanic_requests")
		.select(
			`
			id,
			requester_id,
			listing_id,
			vehicle_id,
			vehicle_details,
			mechanic_id,
			status,
			mechanic_notes,
			fee,
			paid,
			created_at,
			responded_at
		`,
		)
		.eq("requester_id", buyerId)
		.order("created_at", { ascending: false });

	if (error) return { data: [], error };

	return {
		data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
		error: null,
	};
}

/** Get detail of a single mechanic request (with listing, vehicle, mechanic). */
export async function getMechanicRequestDetail(
	requestId: string,
	userId: string,
): Promise<{ data: MechanicRequest | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("mechanic_requests")
		.select(
			`
			id,
			requester_id,
			listing_id,
			vehicle_id,
			vehicle_details,
			mechanic_id,
			status,
			mechanic_notes,
			fee,
			paid,
			created_at,
			responded_at
		`,
		)
		.eq("id", requestId)
		.maybeSingle();

	if (error) return { data: null, error };
	if (!data) return { data: null, error: null };

	const row = data as Record<string, unknown>;
	if (row.requester_id !== userId) {
		return { data: null, error: new Error("Forbidden") };
	}

	return { data: mapRow(row), error: null };
}
