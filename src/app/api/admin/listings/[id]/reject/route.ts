// ============================================================================
// POST /api/admin/listings/[id]/reject
// ============================================================================
//
// Reject a listing with a reason. Requires admin role.
// Body: { reason: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { rejectListing } from "@/lib/features/admin/services";

const schema = z.object({
	reason: z.string().min(1, "Reason is required"),
});

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;
	const body = await req.json();
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 400 },
		);
	}

	const { error } = await rejectListing(auth.userId, id, parsed.data.reason);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to reject listing" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
