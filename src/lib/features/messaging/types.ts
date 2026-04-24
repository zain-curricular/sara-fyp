// ============================================================================
// Messaging — Types
// ============================================================================
//
// Domain types for the real-time messaging feature. Conversations link a
// buyer and seller (optionally to a listing / order). Messages live inside
// conversations. These shapes are returned by the messaging services and
// consumed by both API routes and React hooks.

/** Other party's minimal public profile, embedded in a Conversation. */
export type OtherParty = {
	id: string;
	fullName: string;
	avatarUrl: string | null;
};

/** Minimal listing stub embedded in a Conversation for context rail display. */
export type ConversationListing = {
	id: string;
	title: string;
	images: unknown;
};

/** A conversation between a buyer and a seller, optionally tied to a listing or order. */
export type Conversation = {
	id: string;
	buyerId: string;
	sellerId: string;
	listingId: string | null;
	orderId: string | null;
	lastMessageAt: string;
	lastMessagePreview: string;
	buyerUnreadCount: number;
	sellerUnreadCount: number;
	otherParty: OtherParty;
	listing?: ConversationListing;
};

/** A single chat message inside a conversation. */
export type Message = {
	id: string;
	conversationId: string;
	senderId: string;
	body: string;
	attachments: string[];
	readAt: string | null;
	createdAt: string;
};

/** Envelope returned by the conversation list API. */
export type ConversationsListPayload = {
	conversations: Conversation[];
	total: number;
};

/** Envelope returned by the messages list API. */
export type MessagesListPayload = {
	messages: Message[];
	total: number;
	page: number;
};
