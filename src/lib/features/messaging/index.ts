// ============================================================================
// Messaging — Client Barrel
// ============================================================================
//
// Import from `@/lib/features/messaging` for types, schemas, and hooks.
// Never import services from this barrel — they are server-only.

export type {
	Conversation,
	ConversationListing,
	ConversationsListPayload,
	Message,
	MessagesListPayload,
	OtherParty,
} from "./types";

export type { SendMessageInput, StartConversationInput } from "./schemas";
export { sendMessageSchema, startConversationSchema } from "./schemas";

export {
	useConversations,
	useMarkConversationRead,
	useMessages,
	useRealtimeMessages,
	useSendMessage,
	useStartConversation,
} from "./hooks";
