// ============================================================================
// GET /api/conversations/unread-count — caller's total unread messages
// ============================================================================
//
// Auth required. Returns { unreadCount } summed across every conversation the
// caller participates in (buyer side + seller side). Powers the site-header
// messages badge. Thin adapter — the sum lives in the messaging service.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getUnreadMessageCount } from "@/lib/features/messaging/services";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await getUnreadMessageCount(auth.userId);

	if (error) {
		console.error("[GET /api/conversations/unread-count]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load unread count" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: { unreadCount: data } });
}
