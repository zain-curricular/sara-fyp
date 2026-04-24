// ============================================================================
// POST /api/admin/disputes/[id]/resolve
// ============================================================================
//
// Resolve a dispute in favour of buyer or seller. Requires admin role.
// Body: { winner: "buyer" | "seller", note: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { resolveDispute } from "@/lib/features/admin/services";

const schema = z.object({
	winner: z.enum(["buyer", "seller"]),
	note: z.string().min(1, "Note is required"),
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

	const resolution = parsed.data.winner === "buyer" ? "resolved_buyer" : "resolved_seller";

	const { error } = await resolveDispute(auth.userId, id, resolution, parsed.data.note);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to resolve dispute" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
