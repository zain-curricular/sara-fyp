// ============================================================================
// POST /api/admin/users/[id]/grant-admin
// ============================================================================
//
// Grants the admin role to a user. Requires admin caller.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { grantAdminRole } from "@/lib/features/admin/services";

export async function POST(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;

	const { error } = await grantAdminRole(auth.userId, id);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to grant admin role" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
