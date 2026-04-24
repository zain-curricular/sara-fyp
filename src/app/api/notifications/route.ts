// ============================================================================
// GET /api/notifications — list notifications
// ============================================================================
//
// Returns notifications for the authenticated user, newest-first.
// Query param: ?unread=true to return only unread notifications.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { listNotifications } from "@/lib/features/notifications/services";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { searchParams } = request.nextUrl;
	const onlyUnread = searchParams.get("unread") === "true";

	const { data, error } = await listNotifications(auth.userId, onlyUnread);

	if (error) {
		console.error("[GET /api/notifications]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load notifications" },
			{ status: 500 },
		);
	}

	const notifications = data ?? [];
	const unreadCount = notifications.filter((n) => !n.readAt).length;

	return NextResponse.json({
		ok: true,
		data: {
			notifications,
			total: notifications.length,
			unreadCount,
		},
	});
}
