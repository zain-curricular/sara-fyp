// ============================================================================
// GET /api/listings — public listing search
// POST /api/listings — create listing (auth + seller role required)
// ============================================================================
//
// GET:   Delegates to searchListingsPublic(). Query params are parsed via
//        listingsSearchParamsSchema. Returns paginated results + pagination
//        metadata.
//
// POST:  Creates a new listing row owned by the authenticated user. Requires
//        seller role. Body is validated with an inline Zod schema covering
//        the insertable listing columns (images inserted into listing_images
//        via a follow-up batch insert).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { listingsSearchParamsSchema } from "@/lib/features/listings/schemas";
import { searchListingsPublic } from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// GET — public search
// ----------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = new URL(request.url);
	const parsed = listingsSearchParamsSchema.safeParse(
		Object.fromEntries(searchParams),
	);

	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
			{ status: 400 },
		);
	}

	const { data, pagination, error } = await searchListingsPublic(parsed.data);

	if (error) {
		console.error("[GET /api/listings]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to search listings" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data, pagination });
}

// ----------------------------------------------------------------------------
// POST — create listing
// ----------------------------------------------------------------------------

const CreateListingSchema = z.object({
	title: z.string().min(3).max(120),
	description: z.string().max(2000).optional(),
	price: z.number().positive(),
	compare_at_price: z.number().positive().optional(),
	condition: z.enum(["new", "used", "refurbished", "oem", "aftermarket"]),
	category_id: z.string().uuid(),
	part_category_id: z.string().uuid().optional(),
	model_id: z.string().uuid().optional(),
	city: z.string().min(2),
	area: z.string().optional(),
	stock: z.number().int().min(1).default(1),
	min_order_qty: z.number().int().min(1).default(1),
	is_wholesale: z.boolean().default(false),
	images: z.array(z.string()).max(8).default([]),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	// Seller role required
	if (!auth.roles.includes("seller")) {
		return NextResponse.json(
			{ ok: false, error: "Seller role required" },
			{ status: 403 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const parsed = CreateListingSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { images, ...listingFields } = parsed.data;

	const supabase = await createServerSupabaseClient();

	// Insert listing row
	const { data: inserted, error: insertError } = await supabase
		.from("listings")
		.insert({
			...listingFields,
			user_id: auth.userId,
			status: "draft",
		})
		.select("*")
		.single();

	if (insertError || !inserted) {
		console.error("[POST /api/listings] insert:", insertError);
		return NextResponse.json(
			{ ok: false, error: "Failed to create listing" },
			{ status: 500 },
		);
	}

	// Insert associated image rows (best-effort — listing is already created)
	if (images.length > 0) {
		const imageRows = images.map((url, idx) => ({
			listing_id: (inserted as { id: string }).id,
			url,
			storage_path: url,
			position: idx,
		}));

		const { error: imagesError } = await supabase
			.from("listing_images")
			.insert(imageRows);

		if (imagesError) {
			console.error("[POST /api/listings] listing_images insert:", imagesError);
		}
	}

	return NextResponse.json({ ok: true, data: inserted }, { status: 201 });
}
