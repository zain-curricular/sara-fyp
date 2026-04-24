// ============================================================================
// API: Mechanic Request Accept — POST
// ============================================================================
//
// POST /api/mechanic/requests/[id]/accept
//
// Assigns this mechanic to the verification request. Atomically sets
// mechanic_id + status='assigned' and notifies the buyer.
// Requires mechanic role.

import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { acceptRequest } from "@/lib/features/mechanic/services";

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const auth = await requireRole("mechanic");
	if (!auth.ok) return auth.error;

	const { id } = await params;

	if (!id) {
		return NextResponse.json({ ok: false, error: "Missing request id" }, { status: 400 });
	}

	const { error } = await acceptRequest(auth.userId, id);

	if (error) {
		const message =
			error instanceof Error ? error.message : "Failed to accept request";
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}

	return NextResponse.json({ ok: true });
}
