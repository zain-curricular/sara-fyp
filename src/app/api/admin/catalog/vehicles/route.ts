// ============================================================================
// GET + POST /api/admin/catalog/vehicles
// ============================================================================
//
// GET: list all vehicle models
// POST: create a new vehicle model
// Both require admin role.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createVehicle, listAdminVehicles } from "@/lib/features/admin/services";

const createSchema = z.object({
	make: z.string().min(1, "Make is required"),
	model: z.string().min(1, "Model is required"),
	yearStart: z.number().int().nullable().optional(),
	yearEnd: z.number().int().nullable().optional(),
	bodyType: z.string().nullable().optional(),
	engine: z.string().nullable().optional(),
});

export async function GET() {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await listAdminVehicles();
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to load vehicles" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const body = await req.json();
	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 400 },
		);
	}

	const { data, error } = await createVehicle({
		make: parsed.data.make,
		model: parsed.data.model,
		yearStart: parsed.data.yearStart ?? null,
		yearEnd: parsed.data.yearEnd ?? null,
		bodyType: parsed.data.bodyType ?? null,
		engine: parsed.data.engine ?? null,
	});

	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to create vehicle" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
