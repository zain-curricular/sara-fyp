// ============================================================================
// POST /api/addresses/[id]/default — set address as default
// ============================================================================
//
// Unsets all other addresses for the user then sets this one as default.
// Ownership is verified inside the service.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { setDefaultAddress } from "@/lib/features/addresses/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
	_request: Request,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { error } = await setDefaultAddress(auth.userId, id);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden" || msg === "Address not found") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error("[POST /api/addresses/[id]/default]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to set default address" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}
