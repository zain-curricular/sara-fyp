// ============================================================================
// GET + POST /api/admin/settings
// ============================================================================
//
// GET: list all platform settings
// POST: upsert a platform setting { key, value }
// Both require admin role.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { listPlatformSettings, upsertPlatformSetting } from "@/lib/features/admin/services";

const upsertSchema = z.object({
	key: z.string().min(1, "Key is required"),
	value: z.string(),
});

export async function GET() {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await listPlatformSettings();
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to load settings" }, { status: 500 });
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
	const parsed = upsertSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 400 },
		);
	}

	const { error } = await upsertPlatformSetting(parsed.data.key, parsed.data.value);
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to save setting" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
