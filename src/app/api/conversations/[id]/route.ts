// ============================================================================
// GET /api/conversations/[id] — conversation detail
// ============================================================================
//
// Returns conversation metadata plus the first page of messages. The caller
// must be a participant (buyer or seller) — otherwise a 404 is returned to
// avoid leaking conversation existence.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getMessages } from "@/lib/features/messaging/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	// Use getMessages which internally verifies participant access
	const { data: messages, error } = await getMessages(id, auth.userId, 1);

	if (error) {
		const errMsg = error instanceof Error ? error.message : String(error);
		if (errMsg === "Conversation not found" || errMsg === "Unauthorized") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error(`[GET /api/conversations/${id}]`, error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load conversation" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		ok: true,
		data: {
			messages: messages ?? [],
			total: messages?.length ?? 0,
			page: 1,
		},
	});
}
