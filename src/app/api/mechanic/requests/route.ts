// ============================================================================
// API: Mechanic Requests — GET pool
// ============================================================================
//
// GET /api/mechanic/requests  — returns pending requests in mechanic's service areas
//
// Requires mechanic role. Returns the open pool so the mechanic can
// browse and accept available verification jobs.

import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { listPendingRequests } from "@/lib/features/mechanic/services";

export async function GET(): Promise<NextResponse> {
	const auth = await requireRole("mechanic");
	if (!auth.ok) return auth.error;

	const { data, error } = await listPendingRequests(auth.userId);

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to load pending requests" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data });
}
