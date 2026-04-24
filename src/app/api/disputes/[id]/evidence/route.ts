// ============================================================================
// POST /api/disputes/[id]/evidence
// ============================================================================
//
// Append counter-evidence URLs to an existing dispute.
// Both the buyer who opened it and the seller can add evidence.
//
// Body: { urls: string[] }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { addDisputeEvidence } from "@/lib/features/disputes/services";

const bodySchema = z.object({
	urls: z
		.array(z.string().url("Each URL must be valid"))
		.min(1, "Provide at least one URL")
		.max(10, "Maximum 10 URLs per submission"),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { error } = await addDisputeEvidence(id, auth.userId, parsed.data.urls);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to add evidence";
		if (msg === "Forbidden") {
			return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
		}
		console.error("[POST /api/disputes/:id/evidence]", error);
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data: null });
}
