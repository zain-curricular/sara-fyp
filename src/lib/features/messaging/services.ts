// ============================================================================
// Messaging — Services
// ============================================================================
//
// Server-only data access for the messaging feature. Each function performs
// a single focused Supabase query and returns { data, error } — never throws.
//
// Conversations are identified by a composite (buyer_id, seller_id, listing_id)
// key so "Contact Seller" buttons are idempotent — repeated calls return the
// same conversation.
//
// Tables relied on:
//   conversations  — one row per buyer/seller/listing combo
//   messages       — individual chat messages
//   profiles       — public display names and avatars
//   listings       — listing title and images for the context rail

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { Conversation, Message } from "@/lib/features/messaging/types";

// ----------------------------------------------------------------------------
// Get or create conversation
// ----------------------------------------------------------------------------

/**
 * Upserts a conversation by (buyer_id, seller_id, listing_id) composite key.
 * The buyer is always the caller — the service does not enforce this; the
 * API route must pass the authenticated user's id as buyerId.
 */
export async function getOrCreateConversation(
	buyerId: string,
	sellerId: string,
	listingId?: string,
): Promise<{ data: { conversationId: string } | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Try to find an existing conversation first
	let query = supabase
		.from("conversations")
		.select("id")
		.eq("buyer_id", buyerId)
		.eq("seller_id", sellerId);

	if (listingId) {
		query = query.eq("listing_id", listingId);
	} else {
		query = query.is("listing_id", null);
	}

	const { data: existing, error: findError } = await query.maybeSingle();

	if (findError) {
		return { data: null, error: findError };
	}

	if (existing) {
		return { data: { conversationId: existing.id as string }, error: null };
	}

	// Create new conversation
	const { data: created, error: createError } = await supabase
		.from("conversations")
		.insert({
			buyer_id: buyerId,
			seller_id: sellerId,
			listing_id: listingId ?? null,
			last_message_at: new Date().toISOString(),
			last_message_preview: "",
			buyer_unread_count: 0,
			seller_unread_count: 0,
		})
		.select("id")
		.single();

	if (createError) {
		return { data: null, error: createError };
	}

	return { data: { conversationId: (created as { id: string }).id }, error: null };
}

// ----------------------------------------------------------------------------
// List conversations for a user
// ----------------------------------------------------------------------------

/** Returns all conversations for a user (as buyer or seller), newest-first. */
export async function listConversations(
	userId: string,
	role: "buyer" | "seller",
): Promise<{ data: Conversation[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const column = role === "buyer" ? "buyer_id" : "seller_id";
	const otherColumn = role === "buyer" ? "seller_id" : "buyer_id";

	const { data, error } = await supabase
		.from("conversations")
		.select(`
			id,
			buyer_id,
			seller_id,
			listing_id,
			order_id,
			last_message_at,
			last_message_preview,
			buyer_unread_count,
			seller_unread_count
		`)
		.eq(column, userId)
		.order("last_message_at", { ascending: false })
		.limit(50);

	if (error) {
		return { data: null, error };
	}

	if (!data || data.length === 0) {
		return { data: [], error: null };
	}

	// Collect other-party IDs and listing IDs for batch fetching
	const otherPartyIds = [...new Set(data.map((row) => row[otherColumn as keyof typeof row] as string))];
	const listingIds = [...new Set(data.filter((row) => row.listing_id).map((row) => row.listing_id as string))];

	// Batch-fetch other party profiles
	const { data: profiles } = await supabase
		.from("profiles")
		.select("id, full_name, avatar_url")
		.in("id", otherPartyIds);

	const profileMap = new Map(
		(profiles ?? []).map((p) => [p.id as string, p as { id: string; full_name: string | null; avatar_url: string | null }]),
	);

	// Batch-fetch listings if any
	const listingMap = new Map<string, { id: string; title: string; images: unknown }>();
	if (listingIds.length > 0) {
		const { data: listings } = await supabase
			.from("listings")
			.select("id, title")
			.in("id", listingIds);

		(listings ?? []).forEach((l) => {
			listingMap.set(l.id as string, { id: l.id as string, title: l.title as string, images: null });
		});
	}

	const conversations: Conversation[] = data.map((row) => {
		const otherPartyId = row[otherColumn as keyof typeof row] as string;
		const profile = profileMap.get(otherPartyId);
		const listing = row.listing_id ? listingMap.get(row.listing_id as string) : undefined;

		return {
			id: row.id as string,
			buyerId: row.buyer_id as string,
			sellerId: row.seller_id as string,
			listingId: (row.listing_id as string | null) ?? null,
			orderId: (row.order_id as string | null) ?? null,
			lastMessageAt: row.last_message_at as string,
			lastMessagePreview: (row.last_message_preview as string) ?? "",
			buyerUnreadCount: (row.buyer_unread_count as number) ?? 0,
			sellerUnreadCount: (row.seller_unread_count as number) ?? 0,
			otherParty: {
				id: otherPartyId,
				fullName: profile?.full_name ?? "Unknown",
				avatarUrl: profile?.avatar_url ?? null,
			},
			listing,
		};
	});

	return { data: conversations, error: null };
}

// ----------------------------------------------------------------------------
// Get messages in a conversation
// ----------------------------------------------------------------------------

const MESSAGES_PER_PAGE = 30;

/**
 * Returns paginated messages for a conversation.
 * userId is verified against buyer_id or seller_id to prevent BOLA.
 */
export async function getMessages(
	conversationId: string,
	userId: string,
	page = 1,
): Promise<{ data: Message[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify the user is a participant
	const { data: convo, error: convoError } = await supabase
		.from("conversations")
		.select("id, buyer_id, seller_id")
		.eq("id", conversationId)
		.maybeSingle();

	if (convoError) return { data: null, error: convoError };
	if (!convo) return { data: null, error: new Error("Conversation not found") };

	const c = convo as { id: string; buyer_id: string; seller_id: string };
	if (c.buyer_id !== userId && c.seller_id !== userId) {
		return { data: null, error: new Error("Unauthorized") };
	}

	const offset = (page - 1) * MESSAGES_PER_PAGE;

	const { data, error } = await supabase
		.from("messages")
		.select("id, conversation_id, sender_id, body, attachments, read_at, created_at")
		.eq("conversation_id", conversationId)
		.order("created_at", { ascending: true })
		.range(offset, offset + MESSAGES_PER_PAGE - 1);

	if (error) return { data: null, error };

	const messages: Message[] = (data ?? []).map((row) => ({
		id: row.id as string,
		conversationId: row.conversation_id as string,
		senderId: row.sender_id as string,
		body: row.body as string,
		attachments: (row.attachments as string[]) ?? [],
		readAt: (row.read_at as string | null) ?? null,
		createdAt: row.created_at as string,
	}));

	return { data: messages, error: null };
}

// ----------------------------------------------------------------------------
// Send a message
// ----------------------------------------------------------------------------

/**
 * Inserts a message and updates conversation preview + unread counts.
 * senderId must be the authenticated user — the API route must enforce this.
 */
export async function sendMessage(
	conversationId: string,
	senderId: string,
	body: string,
	attachments: string[] = [],
): Promise<{ data: Message | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	// Verify participant
	const { data: convo, error: convoError } = await supabase
		.from("conversations")
		.select("id, buyer_id, seller_id")
		.eq("id", conversationId)
		.maybeSingle();

	if (convoError) return { data: null, error: convoError };
	if (!convo) return { data: null, error: new Error("Conversation not found") };

	const c = convo as { id: string; buyer_id: string; seller_id: string };
	if (c.buyer_id !== senderId && c.seller_id !== senderId) {
		return { data: null, error: new Error("Unauthorized") };
	}

	// Insert the message
	const { data: msg, error: msgError } = await supabase
		.from("messages")
		.insert({
			conversation_id: conversationId,
			sender_id: senderId,
			body,
			attachments,
		})
		.select("id, conversation_id, sender_id, body, attachments, read_at, created_at")
		.single();

	if (msgError) return { data: null, error: msgError };

	// Update conversation preview and increment the recipient's unread count
	const isBuyer = c.buyer_id === senderId;
	const unreadColumn = isBuyer ? "seller_unread_count" : "buyer_unread_count";

	await supabase.rpc("increment_unread_and_preview", {
		p_conversation_id: conversationId,
		p_preview: body.slice(0, 120),
		p_unread_column: unreadColumn,
	});

	const row = msg as {
		id: string;
		conversation_id: string;
		sender_id: string;
		body: string;
		attachments: string[];
		read_at: string | null;
		created_at: string;
	};

	return {
		data: {
			id: row.id,
			conversationId: row.conversation_id,
			senderId: row.sender_id,
			body: row.body,
			attachments: row.attachments ?? [],
			readAt: row.read_at ?? null,
			createdAt: row.created_at,
		},
		error: null,
	};
}

// ----------------------------------------------------------------------------
// Mark messages read
// ----------------------------------------------------------------------------

/**
 * Marks all unread messages in a conversation as read for the given user,
 * and resets their unread counter. Calls a Supabase RPC for atomicity.
 */
export async function markConversationRead(
	conversationId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase.rpc("mark_messages_read", {
		p_conversation_id: conversationId,
		p_user_id: userId,
	});

	return { error: error ?? null };
}
