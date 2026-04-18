// ============================================================================
// Messaging — data access (service-role client; see markMessagesReadWithUserJwt)
// ============================================================================
//
// Security: `getAdmin()` bypasses RLS. Do not call these DAFs from routes
// directly — always go through `messagingOps` (or future services) so
// participant / listing rules are enforced.

import { createUserSupabaseClient } from '@/lib/supabase/userClient'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { ConversationRow, Database, MessageRow } from '@/lib/supabase/database.types'

const conversationCols =
	'id, listing_id, buyer_id, seller_id, last_message_at, last_message_preview, unread_count_buyer, unread_count_seller, created_at, updated_at' as const

const messageCols = 'id, conversation_id, sender_id, content, read_at, created_at' as const

export type PaginatedConversations = {
	data: ConversationRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export type PaginatedMessages = {
	data: MessageRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export async function getConversationById(
	id: string,
): Promise<{ data: ConversationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('conversations')
		.select(conversationCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('messaging:getConversationById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Idempotent open — buyer + listing seller triple; ON CONFLICT refresh updated_at.
 * Service-role only; caller must verify buyer/listing rules.
 */
export async function upsertConversationByTriple(input: {
	listing_id: string
	buyer_id: string
	seller_id: string
}): Promise<{ data: ConversationRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('conversations')
		.upsert(
			{
				listing_id: input.listing_id,
				buyer_id: input.buyer_id,
				seller_id: input.seller_id,
			},
			{ onConflict: 'listing_id,buyer_id,seller_id' },
		)
		.select(conversationCols)
		.maybeSingle()

	if (error) {
		logDatabaseError('messaging:upsertConversationByTriple', { listing_id: input.listing_id }, error)
	}
	return { data, error }
}

export async function listConversationsForUser(
	userId: string,
	limit: number,
	offset: number,
): Promise<PaginatedConversations> {
	const to = offset + limit - 1
	const { data: rows, error, count } = await getAdmin()
		.from('conversations')
		.select(conversationCols, { count: 'exact' })
		.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
		.order('updated_at', { ascending: false })
		.range(offset, to)

	if (error) {
		logDatabaseError('messaging:listConversationsForUser', { userId, limit, offset }, error)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}

/** Service-role insert; caller must verify sender is a conversation participant. */
export async function insertMessage(
	row: Database['public']['Tables']['messages']['Insert'] &
		Pick<MessageRow, 'conversation_id' | 'sender_id' | 'content'>,
): Promise<{ data: MessageRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('messages')
		.insert(row)
		.select(messageCols)
		.maybeSingle()

	if (error) {
		logDatabaseError('messaging:insertMessage', { conversation_id: row.conversation_id }, error)
	}
	return { data, error }
}

export async function listMessagesForConversation(
	conversationId: string,
	limit: number,
	offset: number,
): Promise<PaginatedMessages> {
	const to = offset + limit - 1
	const { data: rows, error, count } = await getAdmin()
		.from('messages')
		.select(messageCols, { count: 'exact' })
		.eq('conversation_id', conversationId)
		.order('created_at', { ascending: true })
		.range(offset, to)

	if (error) {
		logDatabaseError('messaging:listMessagesForConversation', { conversationId, limit, offset }, error)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}

/**
 * SECURITY INVOKER RPC — caller JWT required (`auth.uid()` inside Postgres).
 * Exception: user-scoped client, not service role (see ticket).
 */
export async function markMessagesReadWithUserJwt(
	accessToken: string,
	conversationId: string,
): Promise<{ error: unknown }> {
	const supabase = createUserSupabaseClient(accessToken)
	const { error } = await supabase.rpc('mark_messages_read', {
		p_conversation_id: conversationId,
	})
	if (error) {
		logDatabaseError('messaging:markMessagesReadWithUserJwt', { conversationId }, error)
	}
	return { error }
}
