// ============================================================================
// Notifications — list, count, mark read (server-only)
// ============================================================================

import 'server-only'

import * as Sentry from '@sentry/nextjs'

import { serializeError } from '@/lib/utils/serializeError'

import {
	bulkMarkAllReadForUser,
	countUnreadNotificationsForUser,
	listNotificationsForUser,
	updateNotificationReadForUser,
	type PaginatedNotifications,
} from '../_data-access/notificationsDafs'

export const NOTIFICATIONS_REALTIME_HINT = {
	schema: 'public',
	table: 'notifications',
	events: ['INSERT', 'UPDATE'] as const,
	filter_template: 'user_id=eq.<user_id>',
	note: 'Subscribe with Supabase Realtime; RLS limits events to the signed-in user.',
} as const

export async function listMyNotifications(input: {
	userId: string
	page: number
	limit: number
	unreadFirst: boolean
}): Promise<PaginatedNotifications> {
	const offset = (input.page - 1) * input.limit
	const { data, error, pagination } = await listNotificationsForUser(input.userId, {
		limit: input.limit,
		offset,
		unreadFirst: input.unreadFirst,
	})

	if (error) {
		console.error('notifications:listMyNotifications failed', {
			userId: input.userId,
			error: serializeError(error),
		})
		Sentry.captureException(error instanceof Error ? error : new Error('list notifications failed'), {
			extra: { userId: input.userId, page: input.page },
		})
	}

	return { data, error, pagination }
}

export async function countUnreadForUser(userId: string): Promise<{ count: number; error: unknown }> {
	const { count, error } = await countUnreadNotificationsForUser(userId)
	if (error) {
		console.error('notifications:countUnreadForUser failed', { userId, error: serializeError(error) })
		Sentry.captureException(error instanceof Error ? error : new Error('count unread failed'), {
			extra: { userId },
		})
	}
	return { count, error }
}

export async function markNotificationRead(input: {
	userId: string
	notificationId: string
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data, error } = await updateNotificationReadForUser(input.userId, input.notificationId)
	if (error) {
		console.error('notifications:markNotificationRead failed', {
			userId: input.userId,
			notificationId: input.notificationId,
			error: serializeError(error),
		})
		Sentry.captureException(error instanceof Error ? error : new Error('mark notification read failed'), {
			extra: { userId: input.userId, notificationId: input.notificationId },
		})
		return { data: null, error }
	}
	if (!data) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	return { data, error: null }
}

export async function markAllNotificationsRead(userId: string): Promise<{ marked: number; error: unknown }> {
	const { marked, error } = await bulkMarkAllReadForUser(userId)
	if (error) {
		console.error('notifications:markAllNotificationsRead failed', { userId, error: serializeError(error) })
		Sentry.captureException(error instanceof Error ? error : new Error('mark all read failed'), {
			extra: { userId },
		})
	}
	return { marked, error }
}
