// ============================================================================
// GET /api/mechanic-requests — list buyer's mechanic requests
// POST /api/mechanic-requests — create a new mechanic verification request
// ============================================================================
//
// GET: Returns all requests for the authenticated buyer, newest first.
// POST: Creates a new verification request (status: pending, fee: PKR 500).

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createMechanicRequestSchema } from "@/lib/features/mechanic-requests/schemas";
import {
	createMechanicRequest,
	listMechanicRequestsForBuyer,
} from "@/lib/features/mechanic-requests/services";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await listMechanicRequestsForBuyer(auth.userId);

	if (error) {
		console.error("[GET /api/mechanic-requests]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load requests" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	const parsed = createMechanicRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { data, error } = await createMechanicRequest(auth.userId, parsed.data);

	if (error) {
		console.error("[POST /api/mechanic-requests]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to create request" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
