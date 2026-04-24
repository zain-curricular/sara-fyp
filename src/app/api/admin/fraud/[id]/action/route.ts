// ============================================================================
// POST /api/admin/fraud/[id]/action
// ============================================================================
//
// Action a fraud signal with a note. Requires admin role.
// Body: { note: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { actionFraudSignal } from "@/lib/features/admin/services";

const schema = z.object({
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

	const { error } = await actionFraudSignal(auth.userId, id, parsed.data.note);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to action signal" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
