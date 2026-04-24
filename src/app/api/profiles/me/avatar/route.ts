// ============================================================================
// POST /api/profiles/me/avatar
// ============================================================================
//
// Accepts a multipart/form-data upload with a "file" field (image).
// Uploads to the `avatars` Supabase Storage bucket under the user's ID.
// Updates the `avatar_url` column on the profiles row.
//
// Response shape:
//   { ok: true, data: { avatar_url: string } }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return NextResponse.json(
			{ ok: false, error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
			{ status: 415 },
		);
	}

	if (file.size > MAX_BYTES) {
		return NextResponse.json(
			{ ok: false, error: "File exceeds 5 MB limit" },
			{ status: 413 },
		);
	}

	const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
	const path = `${auth.userId}/avatar.${ext}`;

	const arrayBuffer = await file.arrayBuffer();
	const admin = createAdminSupabaseClient();

	const { error: uploadError } = await admin.storage
		.from("avatars")
		.upload(path, arrayBuffer, {
			contentType: file.type,
			upsert: true,
		});

	if (uploadError) {
		console.error("[POST /api/profiles/me/avatar] upload", uploadError);
		return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
	}

	const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
	const avatar_url = urlData.publicUrl;

	const supabase = await createServerSupabaseClient();
	const { error: updateError } = await supabase
		.from("profiles")
		.update({ avatar_url, updated_at: new Date().toISOString() })
		.eq("id", auth.userId);

	if (updateError) {
		console.error("[POST /api/profiles/me/avatar] update", updateError);
		return NextResponse.json({ ok: false, error: "Failed to save avatar URL" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data: { avatar_url } });
}
