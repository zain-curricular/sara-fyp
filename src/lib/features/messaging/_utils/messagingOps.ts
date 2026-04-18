// ============================================================================
// Messaging — open thread, send, list, mark read
// ============================================================================

import 'server-only'

import * as Sentry from '@sentry/nextjs'

import { getListingById } from '@/lib/features/listings/core/services'
import type { ConversationRow } from '@/lib/supabase/database.types'
import { serializeError } from '@/lib/utils/serializeError'

import {
	getConversationById,
	insertMessage,
	listConversationsForUser,
	listMessagesForConversation,
	markMessagesReadWithUserJwt,
	upsertConversationByTriple,
	type PaginatedConversations,
	type PaginatedMessages,
} from '../_data-access/messagingDafs'

export const MESSAGING_REALTIME_HINT = {
	schema: 'public',
	table: 'messages',
	event: 'INSERT',
	filter_template: 'conversation_id=eq.<conversation_id>',
	note: 'Subscribe with Supabase Realtime; RLS limits events to participants.',
} as const

function unreadForViewer(row: ConversationRow, userId: string): number {
	if (row.buyer_id === userId) {
		return row.unread_count_buyer
	}
	if (row.seller_id === userId) {
		return row.unread_count_seller
	}
	return 0
}

export type ConversationListItem = ConversationRow & { unread_count: number }

function enrichConversation(row: ConversationRow, userId: string): ConversationListItem {
	return {
		...row,
		unread_count: unreadForViewer(row, userId),
	}
}

export async function openOrGetConversation(input: {
	buyerUserId: string
	listingId: string
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(input.listingId)
	if (lErr || !listing) {
		return { data: null, error: lErr ?? new Error('NOT_FOUND') }
	}
	if (listing.user_id === input.buyerUserId) {
		return { data: null, error: new Error('CANNOT_MESSAGE_OWN_LISTING') }
	}
	if (listing.status !== 'active') {
		return { data: null, error: new Error('LISTING_NOT_ACTIVE') }
	}

	const { data: row, error: uErr } = await upsertConversationByTriple({
		listing_id: input.listingId,
		buyer_id: input.buyerUserId,
		seller_id: listing.user_id,
	})
	if (uErr || !row) {
		console.error('messaging:openOrGetConversation upsert failed', {
			listingId: input.listingId,
			error: serializeError(uErr),
		})
		Sentry.captureException(uErr instanceof Error ? uErr : new Error('upsert conversation failed'), {
			extra: { listingId: input.listingId, buyerUserId: input.buyerUserId },
		})
		return { data: null, error: uErr ?? new Error('UPSERT_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}

export async function sendMessage(input: {
	userId: string
	conversationId: string
	content: string
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: conv, error: cErr } = await getConversationById(input.conversationId)
	if (cErr || !conv) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}
	if (conv.buyer_id !== input.userId && conv.seller_id !== input.userId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	const { data: msg, error: mErr } = await insertMessage({
		conversation_id: input.conversationId,
		sender_id: input.userId,
		content: input.content,
	})
	if (mErr || !msg) {
		console.error('messaging:sendMessage insert failed', {
			conversationId: input.conversationId,
			error: serializeError(mErr),
		})
		Sentry.captureException(mErr instanceof Error ? mErr : new Error('insert message failed'), {
			extra: { conversationId: input.conversationId, userId: input.userId },
		})
		return { data: null, error: mErr ?? new Error('INSERT_FAILED') }
	}
	return { data: { id: msg.id }, error: null }
}

export async function getConversationForParticipant(
	userId: string,
	conversationId: string,
): Promise<{ data: ConversationListItem | null; error: unknown }> {
	const { data: conv, error } = await getConversationById(conversationId)
	if (error || !conv) {
		return { data: null, error: error ?? new Error('NOT_FOUND') }
	}
	if (conv.buyer_id !== userId && conv.seller_id !== userId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	return { data: enrichConversation(conv, userId), error: null }
}

export async function listMyConversations(input: {
	userId: string
	page: number
	limit: number
}): Promise<{
	data: ConversationListItem[] | null
	pagination: PaginatedConversations['pagination']
	error: unknown
}> {
	const offset = (input.page - 1) * input.limit
	const result = await listConversationsForUser(input.userId, input.limit, offset)
	if (result.error) {
		return { data: null, pagination: result.pagination, error: result.error }
	}
	const rows = result.data ?? []
	return {
		data: rows.map((r) => enrichConversation(r, input.userId)),
		pagination: result.pagination,
		error: null,
	}
}

export async function listMessagesForParticipant(input: {
	userId: string
	conversationId: string
	page: number
	limit: number
}): Promise<{
	data: PaginatedMessages['data']
	pagination: PaginatedMessages['pagination']
	error: unknown
}> {
	const pageOffset = (input.page - 1) * input.limit
	const emptyPagination = {
		total: 0,
		limit: input.limit,
		offset: pageOffset,
		hasMore: false,
	}

	const { data: conv, error: cErr } = await getConversationById(input.conversationId)
	if (cErr || !conv) {
		return {
			data: null,
			pagination: emptyPagination,
			error: cErr ?? new Error('NOT_FOUND'),
		}
	}
	if (conv.buyer_id !== input.userId && conv.seller_id !== input.userId) {
		return {
			data: null,
			pagination: emptyPagination,
			error: new Error('FORBIDDEN'),
		}
	}

	return listMessagesForConversation(input.conversationId, input.limit, pageOffset)
}

export async function markConversationRead(input: {
	userId: string
	conversationId: string
	accessToken: string
}): Promise<{ data: { ok: true } | null; error: unknown }> {
	const { data: conv, error: cErr } = await getConversationById(input.conversationId)
	if (cErr || !conv) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}
	if (conv.buyer_id !== input.userId && conv.seller_id !== input.userId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	const { error: rpcErr } = await markMessagesReadWithUserJwt(input.accessToken, input.conversationId)
	if (rpcErr) {
		console.error('messaging:markConversationRead rpc failed', {
			conversationId: input.conversationId,
			error: serializeError(rpcErr),
		})
		Sentry.captureException(rpcErr instanceof Error ? rpcErr : new Error('mark_messages_read failed'), {
			extra: { conversationId: input.conversationId, userId: input.userId },
		})
		return { data: null, error: rpcErr }
	}
	return { data: { ok: true }, error: null }
}
