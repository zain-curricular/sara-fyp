// ============================================================================
// POST /api/admin/fraud/[id]/dismiss
// ============================================================================
//
// Dismiss a fraud signal. Requires admin role.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { dismissFraudSignal } from "@/lib/features/admin/services";

export async function POST(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;
	const { error } = await dismissFraudSignal(auth.userId, id);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to dismiss signal" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
