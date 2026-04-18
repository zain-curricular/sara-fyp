// ============================================================================
// Notifications — list, count, mark read (server-only)
// ============================================================================
//
// Delegates to DAFs; DB logging + Sentry live in notificationsDafs only.

import 'server-only'

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
	return listNotificationsForUser(input.userId, {
		limit: input.limit,
		offset,
		unreadFirst: input.unreadFirst,
	})
}

export async function countUnreadForUser(userId: string): Promise<{ count: number; error: unknown | null }> {
	return countUnreadNotificationsForUser(userId)
}

export async function markNotificationRead(input: {
	userId: string
	notificationId: string
}): Promise<{ data: { id: string } | null; error: unknown | null }> {
	const { data, error } = await updateNotificationReadForUser(input.userId, input.notificationId)
	if (error) {
		return { data: null, error }
	}
	if (!data) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	return { data, error: null }
}

export async function markAllNotificationsRead(
	userId: string,
): Promise<{ marked: number; error: unknown | null }> {
	return bulkMarkAllReadForUser(userId)
}
