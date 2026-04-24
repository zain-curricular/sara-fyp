// ============================================================================
// GET /api/admin/kb — list KB documents
// POST /api/admin/kb — add KB document with embedding generation
// ============================================================================
//
// POST body: { title: string, sourceUrl?: string, content: string }
// Generates an embedding via the AI SDK then inserts into kb_documents.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createKBDocument, listKBDocuments } from "@/lib/features/admin/services";

const postSchema = z.object({
	title: z.string().min(1, "Title required"),
	sourceUrl: z.string().url().nullish(),
	content: z.string().min(10, "Content too short"),
});

export async function GET(_req: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { data, error } = await listKBDocuments();
	if (error) {
		return NextResponse.json({ ok: false, error: "Failed to list documents" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;
	if (!auth.roles.includes("admin")) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const raw = await req.json().catch(() => null);
	const parsed = postSchema.safeParse(raw);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 400 },
		);
	}

	const { title, sourceUrl, content } = parsed.data;

	// Generate embedding using AI SDK
	let embedding: number[] = [];
	try {
		const { embedMany } = await import("ai");
		const { createOpenAI } = await import("@ai-sdk/openai");

		const openai = createOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const { embeddings } = await embedMany({
			model: openai.embedding("text-embedding-3-small"),
			values: [content],
		});

		embedding = embeddings[0] ?? [];
	} catch {
		// Embedding generation is best-effort — insert without embedding if it fails
		embedding = [];
	}

	const { data, error } = await createKBDocument(
		title,
		sourceUrl ?? null,
		content,
		embedding,
	);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to create document";
		return NextResponse.json({ ok: false, error: msg }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
