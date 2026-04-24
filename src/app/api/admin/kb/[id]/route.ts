// ============================================================================
// DELETE /api/admin/kb/[id]
// ============================================================================
//
// Delete a KB document by ID. Requires admin role.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { deleteKBDocument } from "@/lib/features/admin/services";

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;

	const { error } = await deleteKBDocument(id);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to delete document" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
