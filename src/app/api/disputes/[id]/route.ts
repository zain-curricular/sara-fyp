// ============================================================================
// GET /api/disputes/[id]
// ============================================================================
//
// Returns full dispute detail for the authenticated buyer, seller, or admin.

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getDisputeDetail } from "@/lib/features/disputes/services";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { data, error } = await getDisputeDetail(id, auth.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to load dispute";
		if (msg === "Forbidden") {
			return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
		}
		console.error("[GET /api/disputes/:id]", error);
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}

	if (!data) {
		return NextResponse.json({ ok: false, error: "Dispute not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, data });
}
