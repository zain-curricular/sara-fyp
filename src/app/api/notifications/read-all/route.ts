// ============================================================================
// POST /api/notifications/read-all — mark all notifications as read
// ============================================================================
//
// Marks every unread notification as read for the authenticated user.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { markAllNotificationsRead } from "@/lib/features/notifications/services";

export async function POST(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { error } = await markAllNotificationsRead(auth.userId);

	if (error) {
		console.error("[POST /api/notifications/read-all]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to mark all notifications as read" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: null });
}
