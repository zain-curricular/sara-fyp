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

	//.. Insert-or-ignore on the (listing_id, buyer_id, seller_id) unique key so
	//.. repeated "Contact Seller" clicks are idempotent and race-safe — no
	//.. find-then-insert window. ignoreDuplicates leaves an existing row
	//.. untouched (we re-select it below) rather than clobbering its
	//.. unread counters / preview.
	const { data: created, error: createError } = await supabase
		.from("conversations")
		.upsert(
			{
				buyer_id: buyerId,
				seller_id: sellerId,
				listing_id: listingId ?? null,
				last_message_at: new Date().toISOString(),
				last_message_preview: "",
				unread_count_buyer: 0,
				unread_count_seller: 0,
			},
			{ onConflict: "listing_id,buyer_id,seller_id", ignoreDuplicates: true },
		)
		.select("id")
		.maybeSingle();

	if (createError) {
		return { data: null, error: createError };
	}

	if (created) {
		return { data: { conversationId: (created as { id: string }).id }, error: null };
	}

	//.. Duplicate ignored — the conversation already exists; fetch its id.
	let existingQuery = supabase
		.from("conversations")
		.select("id")
		.eq("buyer_id", buyerId)
		.eq("seller_id", sellerId);

	existingQuery = listingId
		? existingQuery.eq("listing_id", listingId)
		: existingQuery.is("listing_id", null);

	const { data: existing, error: findError } = await existingQuery.maybeSingle();

	if (findError) {
		return { data: null, error: findError };
	}

	if (!existing) {
		return { data: null, error: new Error("Failed to resolve conversation") };
	}

	return { data: { conversationId: existing.id as string }, error: null };
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
			unread_count_buyer,
			unread_count_seller
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
			buyerUnreadCount: (row.unread_count_buyer as number) ?? 0,
			sellerUnreadCount: (row.unread_count_seller as number) ?? 0,
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
// Total unread message count (header badge)
// ----------------------------------------------------------------------------

/**
 * Sums a user's unread messages across every conversation: the buyer-side
 * counter for conversations where they are the buyer, plus the seller-side
 * counter where they are the seller. Powers the site-header messages badge.
 */
export async function getUnreadMessageCount(
	userId: string,
): Promise<{ data: number; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("conversations")
		.select("buyer_id, seller_id, unread_count_buyer, unread_count_seller")
		.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
		.limit(500);

	if (error) {
		return { data: 0, error };
	}

	// Count only the side the caller actually occupies in each conversation.
	const total = (data ?? []).reduce((sum, row) => {
		const asBuyer = row.buyer_id === userId ? ((row.unread_count_buyer as number) ?? 0) : 0;
		const asSeller = row.seller_id === userId ? ((row.unread_count_seller as number) ?? 0) : 0;
		return sum + asBuyer + asSeller;
	}, 0);

	return { data: total, error: null };
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
		.select("id, conversation_id, sender_id, content, attachments, read_at, created_at")
		.eq("conversation_id", conversationId)
		.order("created_at", { ascending: true })
		.range(offset, offset + MESSAGES_PER_PAGE - 1);

	if (error) return { data: null, error };

	const messages: Message[] = (data ?? []).map((row) => ({
		id: row.id as string,
		conversationId: row.conversation_id as string,
		senderId: row.sender_id as string,
		body: row.content as string,
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

	// Insert the message. The `on_new_message` trigger (handle_new_message)
	// updates the conversation preview + last_message_at, increments the
	// recipient's unread counter, and inserts their new_message notification —
	// so no client-side increment/preview RPC is needed here.
	const { data: msg, error: msgError } = await supabase
		.from("messages")
		.insert({
			conversation_id: conversationId,
			sender_id: senderId,
			content: body,
			attachments,
		})
		.select("id, conversation_id, sender_id, content, attachments, read_at, created_at")
		.single();

	if (msgError) return { data: null, error: msgError };

	const row = msg as {
		id: string;
		conversation_id: string;
		sender_id: string;
		content: string;
		attachments: string[];
		read_at: string | null;
		created_at: string;
	};

	return {
		data: {
			id: row.id,
			conversationId: row.conversation_id,
			senderId: row.sender_id,
			body: row.content,
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
 * Marks all unread messages in a conversation as read for the caller, and
 * resets their unread counter. The `mark_messages_read` RPC derives the user
 * from auth.uid() (single argument) and enforces participant membership, so the
 * server client's session is what identifies the reader — no user id is passed.
 */
export async function markConversationRead(
	conversationId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase.rpc("mark_messages_read", {
		p_conversation_id: conversationId,
	});

	return { error: error ?? null };
}
