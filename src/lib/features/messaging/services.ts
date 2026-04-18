// ============================================================================
// Messaging — server barrel
// ============================================================================

import 'server-only'

export type { ConversationListItem } from './_utils/messagingOps'

export {
	MESSAGING_REALTIME_HINT,
	openOrGetConversation,
	sendMessage,
	getConversationForParticipant,
	listMyConversations,
	listMessagesForParticipant,
	markConversationRead,
} from './_utils/messagingOps'
export { messagingMutationErrorToHttp } from './_utils/messagingApiHttp'
export {
	createConversationBodySchema,
	sendMessageBodySchema,
	conversationsMeQuerySchema,
	messagesListQuerySchema,
} from './schemas'
