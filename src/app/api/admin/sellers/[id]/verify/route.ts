// ============================================================================
// POST /api/admin/sellers/[id]/verify
// ============================================================================
//
// Verify or unverify a seller. Requires admin role.
// Body: { verified: boolean }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { setSellerVerified } from "@/lib/features/admin/services";

const schema = z.object({
	verified: z.boolean(),
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

	const { error } = await setSellerVerified(auth.userId, id, parsed.data.verified);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to update seller" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
