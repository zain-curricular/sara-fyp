// ============================================================================
// API: Mechanic Profile — GET + POST
// ============================================================================
//
// GET  /api/mechanic/profile  — fetch current mechanic's profile
// POST /api/mechanic/profile  — create or update mechanic profile (upsert)
//
// Both endpoints require authentication. POST also grants the 'mechanic' role.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import {
	getMechanicProfile,
	upsertMechanicProfile,
} from "@/lib/features/mechanic/services";

// ----------------------------------------------------------------------------
// GET /api/mechanic/profile
// ----------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await getMechanicProfile(auth.userId);

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to load mechanic profile" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data });
}

// ----------------------------------------------------------------------------
// POST /api/mechanic/profile
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const { specialties, serviceAreas, hourlyRate } = body as Record<string, unknown>;

	if (!Array.isArray(specialties) || specialties.length === 0) {
		return NextResponse.json(
			{ ok: false, error: "specialties must be a non-empty array" },
			{ status: 422 },
		);
	}

	if (!Array.isArray(serviceAreas) || serviceAreas.length === 0) {
		return NextResponse.json(
			{ ok: false, error: "serviceAreas must be a non-empty array" },
			{ status: 422 },
		);
	}

	if (typeof hourlyRate !== "number" || hourlyRate <= 0) {
		return NextResponse.json(
			{ ok: false, error: "hourlyRate must be a positive number" },
			{ status: 422 },
		);
	}

	const { error } = await upsertMechanicProfile(auth.userId, {
		specialties: specialties as string[],
		serviceAreas: serviceAreas as string[],
		hourlyRate: hourlyRate as number,
	});

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to save mechanic profile" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}
