// ============================================================================
// GET /api/conversations  — list conversations
// POST /api/conversations — get-or-create a conversation
// ============================================================================
//
// GET:  Returns all conversations for the authenticated user (as buyer or
//       seller). Query param `role=buyer|seller` defaults to "buyer".
// POST: Body = { sellerId, listingId? }. Upserts a conversation by composite
//       (buyer_id, seller_id, listing_id) key and returns { conversationId }.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { startConversationSchema } from "@/lib/features/messaging/schemas";
import { getOrCreateConversation, listConversations } from "@/lib/features/messaging/services";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { searchParams } = request.nextUrl;
	const role = searchParams.get("role") === "seller" ? "seller" : "buyer";

	const { data, error } = await listConversations(auth.userId, role);

	if (error) {
		console.error("[GET /api/conversations]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load conversations" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		ok: true,
		data: {
			conversations: data ?? [],
			total: data?.length ?? 0,
		},
	});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const parsed = startConversationSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const { sellerId, listingId } = parsed.data;

	if (auth.userId === sellerId) {
		return NextResponse.json(
			{ ok: false, error: "Cannot start a conversation with yourself" },
			{ status: 400 },
		);
	}

	const { data, error } = await getOrCreateConversation(auth.userId, sellerId, listingId);

	if (error || !data) {
		console.error("[POST /api/conversations]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to create conversation" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data }, { status: 200 });
}
