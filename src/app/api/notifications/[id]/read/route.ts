// ============================================================================
// POST /api/notifications/[id]/read — mark one notification as read
// ============================================================================
//
// Marks a single notification as read. The user_id guard inside the service
// prevents users from marking other users' notifications.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { markNotificationRead } from "@/lib/features/notifications/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	const { error } = await markNotificationRead(id, auth.userId);

	if (error) {
		console.error(`[POST /api/notifications/${id}/read]`, error);
		return NextResponse.json(
			{ ok: false, error: "Failed to mark notification as read" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: null });
}
