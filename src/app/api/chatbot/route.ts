// ============================================================================
// API: Chatbot — POST
// ============================================================================
//
// POST /api/chatbot
// Body: { sessionId?: string, message: string, userId?: string }
//
// Pipeline:
//   1. Create/get chat session
//   2. Persist user message
//   3. Retrieve context via vector/text search (RAG)
//   4. Build system prompt with context
//   5. If model unavailable → stub response
//   6. Invoke LangChain, persist reply + citations
//   7. Return { ok, data: { response, citations, sessionId } }
//
// Auth is optional — anonymous users get a session tied to no user_id.
// Guardrails: scoped to auto parts / ShopSmart platform queries only.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getChatModel } from "@/lib/ai/provider";
import {
	createOrGetSession,
	appendMessage,
	retrieveContext,
} from "@/lib/features/chatbot/services";
import type { Citation } from "@/lib/features/chatbot/types";

// ----------------------------------------------------------------------------
// System prompt builder
// ----------------------------------------------------------------------------

function buildSystemPrompt(
	kbDocs: { title: string; content: string }[],
	listings: { id: string; title: string; price: number; city: string; condition: string }[],
): string {
	const kbSection =
		kbDocs.length > 0
			? `Knowledge base articles:\n${kbDocs.map((d) => `- ${d.title}: ${d.content}`).join("\n")}`
			: "";

	const listingsSection =
		listings.length > 0
			? `Relevant listings:\n${listings.map((l) => `- ${l.title} · Rs ${l.price.toLocaleString()} · ${l.city} · ${l.condition} (ID: ${l.id})`).join("\n")}`
			: "";

	return `You are ShopSmart Assistant, a helpful AI for Pakistan's auto spare parts marketplace.

${kbSection}
${listingsSection}

RULES
- Only answer questions about spare parts, vehicles, and shopping on ShopSmart.
- Do not make promises about delivery times or availability.
- Do not invent OEM part numbers — only reference numbers found in context.
- For product-specific questions, always offer "Contact the seller" as an escalation path.
- Politely decline medical, legal, and unrelated questions.
- Answer in clear, concise English. Use PKR for prices.
- Be helpful, friendly, and professional.`.trim();
}

// ----------------------------------------------------------------------------
// Route handler
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
	let rawBody: unknown;
	try {
		rawBody = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const body = rawBody as Record<string, unknown>;
	const message = typeof body.message === "string" ? body.message.trim() : null;

	if (!message || message.length === 0 || message.length > 2000) {
		return NextResponse.json(
			{ ok: false, error: "message is required and must be ≤ 2000 characters" },
			{ status: 400 },
		);
	}

	const userId = typeof body.userId === "string" ? body.userId : null;
	const incomingSessionId =
		typeof body.sessionId === "string" ? body.sessionId : undefined;

	// 1. Create/get session
	const { data: sessionData, error: sessionError } = await createOrGetSession(
		userId,
		incomingSessionId,
	);

	if (sessionError || !sessionData.sessionId) {
		return NextResponse.json(
			{ ok: false, error: "Failed to create chat session" },
			{ status: 500 },
		);
	}

	const sessionId = sessionData.sessionId;

	// 2. Persist user message
	await appendMessage(sessionId, { role: "user", content: message });

	// 3. Retrieve context (RAG)
	const { kbDocs, listings } = await retrieveContext(message);

	// 4. Build citations
	const citations: Citation[] = [
		...kbDocs.map((d) => ({
			type: "kb" as const,
			id: d.id,
			title: d.title,
			url: d.slug ? `/help/${d.slug}` : `/help`,
		})),
		...listings.map((l) => ({
			type: "listing" as const,
			id: l.id,
			title: l.title,
			url: `/listings/${l.id}`,
		})),
	];

	// 5. Check AI availability
	const chatModel = getChatModel();

	if (!chatModel) {
		const stubResponse =
			"I'm currently unavailable. Please contact the seller directly or browse our listings.";
		await appendMessage(sessionId, {
			role: "assistant",
			content: stubResponse,
			citations: [],
		});
		return NextResponse.json({
			ok: true,
			data: { response: stubResponse, citations: [], sessionId },
		});
	}

	// 6. Invoke AI
	try {
		const systemPrompt = buildSystemPrompt(kbDocs, listings);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await (chatModel as any).invoke([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: message },
		]);

		const responseText: string =
			typeof result?.content === "string"
				? result.content
				: (result?.text as string | undefined) ??
				  "I couldn't generate a response. Please try again.";

		// 7. Persist assistant reply
		await appendMessage(sessionId, {
			role: "assistant",
			content: responseText,
			citations,
		});

		return NextResponse.json({
			ok: true,
			data: { response: responseText, citations, sessionId },
		});
	} catch {
		const fallback =
			"I encountered an error. Please try again or contact support@shopsmart.pk.";
		await appendMessage(sessionId, { role: "assistant", content: fallback, citations: [] });
		return NextResponse.json({
			ok: true,
			data: { response: fallback, citations: [], sessionId },
		});
	}
}
