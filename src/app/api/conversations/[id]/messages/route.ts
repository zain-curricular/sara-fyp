// ============================================================================
// GET  /api/conversations/[id]/messages — paginated messages
// POST /api/conversations/[id]/messages — send a message
// ============================================================================
//
// GET:  Returns messages for the conversation, paginated via ?page=N.
//       Participant check is enforced inside getMessages().
// POST: Sends a new message. Sender is always the authenticated user.
//       Body must match sendMessageSchema.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { sendMessageSchema } from "@/lib/features/messaging/schemas";
import { getMessages, sendMessage } from "@/lib/features/messaging/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;
	const { searchParams } = request.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

	const { data, error } = await getMessages(id, auth.userId, page);

	if (error) {
		const errMsg = error instanceof Error ? error.message : String(error);
		if (errMsg === "Conversation not found" || errMsg === "Unauthorized") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error(`[GET /api/conversations/${id}/messages]`, error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load messages" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		ok: true,
		data: {
			messages: data ?? [],
			total: data?.length ?? 0,
			page,
		},
	});
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const parsed = sendMessageSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const { data, error } = await sendMessage(
		id,
		auth.userId,
		parsed.data.body,
		parsed.data.attachments,
	);

	if (error) {
		const errMsg = error instanceof Error ? error.message : String(error);
		if (errMsg === "Conversation not found" || errMsg === "Unauthorized") {
			return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
		}
		console.error(`[POST /api/conversations/${id}/messages]`, error);
		return NextResponse.json(
			{ ok: false, error: "Failed to send message" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}
