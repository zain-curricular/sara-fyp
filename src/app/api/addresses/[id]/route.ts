// ============================================================================
// PATCH /api/addresses/[id] — update saved address
// DELETE /api/addresses/[id] — delete saved address
// ============================================================================
//
// Both operations verify the address belongs to the authenticated user.
// DELETE is idempotent — returns 204 on success.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/features/addresses/schemas";
import {
	deleteAddress,
	updateAddress,
} from "@/lib/features/addresses/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
	request: Request,
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

	const parsed = addressSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { error } = await updateAddress(auth.userId, id, parsed.data);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden" || msg === "Address not found") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error("[PATCH /api/addresses/[id]]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to update address" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}

export async function DELETE(
	_request: Request,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { error } = await deleteAddress(auth.userId, id);

	if (error) {
		console.error("[DELETE /api/addresses/[id]]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to delete address" },
			{ status: 500 },
		);
	}

	return new NextResponse(null, { status: 204 });
}
