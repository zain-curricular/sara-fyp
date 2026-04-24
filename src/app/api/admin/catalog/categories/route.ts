// ============================================================================
// GET + POST /api/admin/catalog/categories
// ============================================================================
//
// GET: list all categories
// POST: create a new category
// Both require admin role.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createCategory, listAdminCategories } from "@/lib/features/admin/services";

const createSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	parentId: z.string().nullable().optional(),
});

export async function GET() {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await listAdminCategories();
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to load categories" }, { status: 500 });
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

	const { error, data } = await createCategory(
		parsed.data.name,
		parsed.data.slug,
		parsed.data.parentId ?? null,
	);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to create category" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
