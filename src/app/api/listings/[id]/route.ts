// ============================================================================
// GET    /api/listings/[id] — public listing detail
// PATCH  /api/listings/[id] — update listing (owner only)
// DELETE /api/listings/[id] — soft-delete listing (owner or admin)
// ============================================================================
//
// GET:    Delegates to getListingDetailForViewer(). Returns listing + images.
//         Viewer id is passed so owners can see their own non-active rows.
// PATCH:  Owner-only update. Validates partial input with PatchListingSchema.
// DELETE: Owner-or-admin soft delete (sets deleted_at = now()).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import {
	getListingDetailForViewer,
	getListingForOwner,
} from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

// ----------------------------------------------------------------------------
// GET — public detail
// ----------------------------------------------------------------------------

export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const { id } = await params;

	// Viewer id is optional — listing is public when active
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data, error } = await getListingDetailForViewer(id, user?.id ?? null);

	if (error) {
		console.error("[GET /api/listings/[id]]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load listing" },
			{ status: 500 },
		);
	}

	if (!data) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	return NextResponse.json({ ok: true, data });
}

// ----------------------------------------------------------------------------
// PATCH — owner update
// ----------------------------------------------------------------------------

const PatchListingSchema = z
	.object({
		title: z.string().min(3).max(120).optional(),
		description: z.string().max(2000).optional(),
		price: z.number().positive().optional(),
		compare_at_price: z.number().positive().optional(),
		condition: z
			.enum(["new", "used", "refurbished", "oem", "aftermarket"])
			.optional(),
		category_id: z.string().uuid().optional(),
		part_category_id: z.string().uuid().optional(),
		model_id: z.string().uuid().optional(),
		city: z.string().min(2).optional(),
		area: z.string().optional(),
		stock: z.number().int().min(0).optional(),
		min_order_qty: z.number().int().min(1).optional(),
		is_wholesale: z.boolean().optional(),
	})
	.strict();

export async function PATCH(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const parsed = PatchListingSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	// Verify ownership
	const { data: existing, error: ownerError } = await getListingForOwner(
		id,
		auth.userId,
	);
	if (ownerError) {
		console.error("[PATCH /api/listings/[id]] owner lookup:", ownerError);
		return NextResponse.json(
			{ ok: false, error: "Failed to update listing" },
			{ status: 500 },
		);
	}
	if (!existing) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	const supabase = await createServerSupabaseClient();
	const { data: updated, error: updateError } = await supabase
		.from("listings")
		.update(parsed.data)
		.eq("id", id)
		.eq("user_id", auth.userId)
		.select("*")
		.single();

	if (updateError) {
		console.error("[PATCH /api/listings/[id]]", updateError);
		return NextResponse.json(
			{ ok: false, error: "Failed to update listing" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: updated });
}

// ----------------------------------------------------------------------------
// DELETE — soft delete (owner or admin)
// ----------------------------------------------------------------------------

export async function DELETE(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const supabase = await createServerSupabaseClient();

	// Fetch listing owner to authorize
	const { data: listing, error: fetchError } = await supabase
		.from("listings")
		.select("id, user_id, deleted_at")
		.eq("id", id)
		.maybeSingle();

	if (fetchError) {
		console.error("[DELETE /api/listings/[id]] fetch:", fetchError);
		return NextResponse.json(
			{ ok: false, error: "Failed to delete listing" },
			{ status: 500 },
		);
	}

	const row = listing as { id: string; user_id: string; deleted_at: string | null } | null;
	if (!row || row.deleted_at) {
		// 404 for both missing and already-deleted — hides existence
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	const isAdmin = auth.roles.includes("admin");
	if (row.user_id !== auth.userId && !isAdmin) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	const { error: updateError } = await supabase
		.from("listings")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", id);

	if (updateError) {
		console.error("[DELETE /api/listings/[id]]", updateError);
		return NextResponse.json(
			{ ok: false, error: "Failed to delete listing" },
			{ status: 500 },
		);
	}

	return new NextResponse(null, { status: 204 });
}
