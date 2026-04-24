// ============================================================================
// DELETE /api/admin/catalog/vehicles/[id]
// ============================================================================
//
// Delete a vehicle model. Requires admin role.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { deleteVehicle } from "@/lib/features/admin/services";

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
	const { error } = await deleteVehicle(id);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to delete vehicle" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
