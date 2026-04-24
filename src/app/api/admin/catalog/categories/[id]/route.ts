// ============================================================================
// PATCH + DELETE /api/admin/catalog/categories/[id]
// ============================================================================
//
// PATCH: update a category's name and slug
// DELETE: delete a category
// Both require admin role.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { deleteCategory, updateCategory } from "@/lib/features/admin/services";

const patchSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
});

export async function PATCH(
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
	const parsed = patchSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 400 },
		);
	}

	const { error } = await updateCategory(id, parsed.data.name, parsed.data.slug);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to update category" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;
	const { error } = await deleteCategory(id);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to delete category" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
