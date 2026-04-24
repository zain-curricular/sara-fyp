// ============================================================================
// GET + POST /api/admin/payouts
// ============================================================================
//
// GET: list all payouts
// POST: run payout batch (marks pending payouts as processing)
// Both require admin role.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { listAdminPayouts, runPayoutBatch } from "@/lib/features/admin/services";

export async function GET() {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await listAdminPayouts();
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to load payouts" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(_req: NextRequest) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await runPayoutBatch(auth.userId);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to run payout batch" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}
