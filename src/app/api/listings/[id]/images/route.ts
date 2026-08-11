// ============================================================================
// /api/listings/[id]/images — listing photos
// ============================================================================
//
// GET  — list images for a listing, ordered by position. Public, no auth.
// POST — upload one photo (multipart/form-data, `file` field) to the
//        `listing-images` bucket and append a `listing_images` row.
//
// POST is owner-only: the create-listing wizard calls it between saving the
// draft and publishing. Validation mirrors the bucket config (jpeg/png/webp,
// 10 MB) so a rejected file fails fast with a readable message instead of a
// generic storage error.
//
// Response shape:
//   { ok: true, data: ListingImageRecord | ListingImageRecord[] }
//   { ok: false, error: string }

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { IMAGE_ALLOWED_TYPES, IMAGE_MAX_BYTES, IMAGE_MAX_PER_LISTING } from "@/lib/features/listings";
import { addListingImage, listListingImages } from "@/lib/features/listings/services";

type RouteParams = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set<string>(IMAGE_ALLOWED_TYPES);

export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const { id } = await params;

	const { data, error } = await listListingImages(id);

	if (error) {
		console.error("[GET /api/listings/[id]/images]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load images" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return NextResponse.json(
			{ ok: false, error: "Only JPEG, PNG, or WebP images are allowed" },
			{ status: 415 },
		);
	}

	if (file.size > IMAGE_MAX_BYTES) {
		return NextResponse.json({ ok: false, error: "File exceeds 10 MB limit" }, { status: 413 });
	}

	const { data, error, reason } = await addListingImage(id, auth.userId, file);

	if (reason === "not_found") {
		return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
	}

	if (reason === "limit_reached") {
		return NextResponse.json(
			{ ok: false, error: `A listing can have at most ${IMAGE_MAX_PER_LISTING} photos` },
			{ status: 409 },
		);
	}

	if (error || !data) {
		console.error("[POST /api/listings/[id]/images]", reason, error);
		return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
