// ============================================================================
// API: Mechanic Verdict — POST
// ============================================================================
//
// POST /api/mechanic/requests/[id]/verdict
// Body: { verdict: VerificationVerdict, notes: string }
//
// Records the mechanic's compatibility verdict for an assigned request.
// Marks request completed and notifies the buyer. Requires mechanic role.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { submitVerdict } from "@/lib/features/mechanic/services";
import type { VerificationVerdict } from "@/lib/features/mechanic/types";

const VALID_VERDICTS: VerificationVerdict[] = [
	"verified_compatible",
	"verified_incompatible",
	"rejected",
];

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const auth = await requireRole("mechanic");
	if (!auth.ok) return auth.error;

	const { id } = await params;

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const { verdict, notes } = body as Record<string, unknown>;

	if (!verdict || !VALID_VERDICTS.includes(verdict as VerificationVerdict)) {
		return NextResponse.json(
			{
				ok: false,
				error: `verdict must be one of: ${VALID_VERDICTS.join(", ")}`,
			},
			{ status: 422 },
		);
	}

	if (typeof notes !== "string" || notes.trim().length < 10) {
		return NextResponse.json(
			{ ok: false, error: "notes must be at least 10 characters" },
			{ status: 422 },
		);
	}

	const { error } = await submitVerdict(
		auth.userId,
		id,
		verdict as VerificationVerdict,
		notes.trim(),
	);

	if (error) {
		const message =
			error instanceof Error ? error.message : "Failed to submit verdict";
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}

	return NextResponse.json({ ok: true });
}
