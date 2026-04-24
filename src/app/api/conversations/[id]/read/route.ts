// ============================================================================
// POST /api/conversations/[id]/read — mark conversation as read
// ============================================================================
//
// Marks all unread messages in the conversation as read for the authenticated
// user and resets their unread counter. Calls the mark_messages_read RPC.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { markConversationRead } from "@/lib/features/messaging/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { error } = await markConversationRead(id, auth.userId);

	if (error) {
		console.error(`[POST /api/conversations/${id}/read]`, error);
		return NextResponse.json(
			{ ok: false, error: "Failed to mark conversation as read" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: null });
}
