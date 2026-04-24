// ============================================================================
// POST /api/listings/[id]/publish — transition listing to active
// ============================================================================
//
// Sets listings.status = 'active'. Owner (seller) or admin only.
// Typical flow: seller creates a draft listing, uploads images, then calls
// publish to make it visible in public search.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const isAdmin = auth.roles.includes("admin");
	const isSeller = auth.roles.includes("seller");

	if (!isAdmin && !isSeller) {
		return NextResponse.json(
			{ ok: false, error: "Seller role required" },
			{ status: 403 },
		);
	}

	const supabase = await createServerSupabaseClient();

	// Verify existence + ownership (admins may publish any listing)
	const { data: listing, error: fetchError } = await supabase
		.from("listings")
		.select("id, user_id, deleted_at, status")
		.eq("id", id)
		.maybeSingle();

	if (fetchError) {
		console.error("[POST /api/listings/[id]/publish] fetch:", fetchError);
		return NextResponse.json(
			{ ok: false, error: "Failed to publish listing" },
			{ status: 500 },
		);
	}

	const row = listing as {
		id: string;
		user_id: string;
		deleted_at: string | null;
		status: string;
	} | null;

	if (!row || row.deleted_at) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	if (row.user_id !== auth.userId && !isAdmin) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	const { data: updated, error: updateError } = await supabase
		.from("listings")
		.update({ status: "active" })
		.eq("id", id)
		.select("*")
		.single();

	if (updateError) {
		console.error("[POST /api/listings/[id]/publish]", updateError);
		return NextResponse.json(
			{ ok: false, error: "Failed to publish listing" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: updated });
}
