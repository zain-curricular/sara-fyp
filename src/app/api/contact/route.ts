// ============================================================================
// API: Contact Form — POST
// ============================================================================
//
// POST /api/contact
// Body: { name, email, subject, message }
//
// Logs the contact form submission to the console (and optionally to the DB).
// No auth required — public contact form.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const { name, email, subject, message } = body as Record<string, unknown>;

	if (
		typeof name !== "string" ||
		typeof email !== "string" ||
		typeof message !== "string" ||
		!name.trim() ||
		!email.trim() ||
		!message.trim()
	) {
		return NextResponse.json(
			{ ok: false, error: "name, email, and message are required" },
			{ status: 422 },
		);
	}

	// Log submission (in production, replace with email service or DB insert)
	console.log("[contact-form]", {
		name: name.trim(),
		email: email.trim(),
		subject: subject ?? "General inquiry",
		message: message.trim(),
		timestamp: new Date().toISOString(),
	});

	return NextResponse.json({ ok: true });
}
