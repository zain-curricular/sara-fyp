// ============================================================================
// GET /api/addresses — list saved addresses
// POST /api/addresses — create saved address
// ============================================================================
//
// GET: Returns all saved addresses for the authenticated user, default first.
// POST: Creates a new address; if isDefault=true, existing defaults are unset.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/features/addresses/schemas";
import {
	createAddress,
	listAddresses,
} from "@/lib/features/addresses/services";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await listAddresses(auth.userId);

	if (error) {
		console.error("[GET /api/addresses]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load addresses" },
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

	const parsed = addressSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { data, error } = await createAddress(auth.userId, parsed.data);

	if (error) {
		console.error("[POST /api/addresses]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to create address" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
