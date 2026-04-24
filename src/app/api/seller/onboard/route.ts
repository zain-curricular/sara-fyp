// ============================================================================
// POST /api/seller/onboard
// ============================================================================
//
// Creates a seller_stores row for the authenticated user and upgrades their
// profile to include the 'seller' role with active_role set to 'seller'.
//
// Validation:
//   - storeName: min 3 chars
//   - slug: min 3, max 60, alphanum + hyphens only, must be globally unique
//   - city: min 2 chars
//   - description: optional, max 500 chars
//   - logoUrl: optional URL
//   - bannerUrl: optional URL
//
// Response:
//   { ok: true,  data: { storeId: string, slug: string } }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const onboardBody = z.object({
	storeName: z.string().min(3, "Store name must be at least 3 characters"),
	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.max(60, "Slug must be under 60 characters")
		.regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
	city: z.string().min(2, "Enter a city"),
	description: z.string().max(500, "Keep it under 500 characters").optional().default(""),
	logoUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
});

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
	// Authenticate
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	// Parse body
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = onboardBody.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);
	}

	const { storeName, slug, city, description, logoUrl, bannerUrl } = parsed.data;
	const supabase = await createServerSupabaseClient();

	// Check slug uniqueness
	const { data: existing } = await supabase
		.from("seller_stores")
		.select("id")
		.eq("slug", slug)
		.maybeSingle();

	if (existing) {
		return NextResponse.json(
			{ ok: false, error: "That slug is already taken. Try a different one." },
			{ status: 409 },
		);
	}

	// Create store
	const { data: store, error: storeError } = await supabase
		.from("seller_stores")
		.insert({
			owner_id: auth.userId,
			name: storeName,
			slug,
			city,
			description,
			logo_url: logoUrl ?? null,
			banner_url: bannerUrl ?? null,
		})
		.select("id, slug")
		.single();

	if (storeError || !store) {
		return NextResponse.json(
			{ ok: false, error: "Failed to create store. Please try again." },
			{ status: 500 },
		);
	}

	// Update profile: add 'seller' to roles[], set active_role = 'seller'
	const updatedRoles = Array.from(new Set([...auth.roles, "seller"]));

	const { error: profileError } = await supabase
		.from("profiles")
		.update({ roles: updatedRoles, active_role: "seller" })
		.eq("id", auth.userId);

	if (profileError) {
		// Store was created — don't block the user. They'll get seller role on next login.
		console.error("[onboard] Failed to update profile roles:", profileError.message);
	}

	return NextResponse.json({ ok: true, data: { storeId: store.id, slug: store.slug } });
}
