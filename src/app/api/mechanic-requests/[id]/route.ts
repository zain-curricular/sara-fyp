// ============================================================================
// GET /api/mechanic-requests/[id] — get mechanic request detail
// ============================================================================
//
// Returns a single mechanic request with listing, vehicle, and mechanic info.
// Only the requester can view their own request (ownership verified in service).

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getMechanicRequestDetail } from "@/lib/features/mechanic-requests/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
	_request: Request,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { data, error } = await getMechanicRequestDetail(id, auth.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error("[GET /api/mechanic-requests/[id]]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load request" },
			{ status: 500 },
		);
	}

	if (!data) {
		return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, data });
}
