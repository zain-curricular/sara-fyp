// ============================================================================
// Notifications — data access (service-role client)
// ============================================================================
//
// Security: `getAdmin()` bypasses RLS. Callers must pass the authenticated
// `userId` from services/routes and never trust client-supplied user ids.

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { NotificationRow } from '@/lib/supabase/database.types'

const notificationCols =
	'id, user_id, type, title, body, entity_type, entity_id, read_at, created_at' as const

export type PaginatedNotifications = {
	data: NotificationRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export async function listNotificationsForUser(
	userId: string,
	opts: { limit: number; offset: number; unreadFirst: boolean },
): Promise<PaginatedNotifications> {
	const { limit, offset, unreadFirst } = opts
	const to = offset + limit - 1

	let q = getAdmin()
		.from('notifications')
		.select(notificationCols, { count: 'exact' })
		.eq('user_id', userId)

	if (unreadFirst) {
		q = q.order('read_at', { ascending: true, nullsFirst: true }).order('created_at', { ascending: false })
	} else {
		q = q.order('created_at', { ascending: false })
	}

	const { data: rows, error, count } = await q.range(offset, to)

	if (error) {
		logDatabaseError('notifications:listNotificationsForUser', { userId, limit, offset, unreadFirst }, error)
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
			hasMore: offset + (rows?.length ?? 0) < total,
		},
		error: null,
	}
}

export async function countUnreadNotificationsForUser(
	userId: string,
): Promise<{ count: number; error: unknown }> {
	const { error, count } = await getAdmin()
		.from('notifications')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null)

	if (error) {
		logDatabaseError('notifications:countUnreadNotificationsForUser', { userId }, error)
		return { count: 0, error }
	}

	return { count: count ?? 0, error: null }
}

/**
 * Marks one notification read. Caller must ensure `userId` is the authenticated user.
 */
export async function updateNotificationReadForUser(
	userId: string,
	notificationId: string,
): Promise<{ data: { id: string } | null; error: unknown }> {
	const readAt = new Date().toISOString()
	const { data, error } = await getAdmin()
		.from('notifications')
		.update({ read_at: readAt })
		.eq('id', notificationId)
		.eq('user_id', userId)
		.select('id')
		.maybeSingle()

	if (error) {
		logDatabaseError(
			'notifications:updateNotificationReadForUser',
			{ userId, notificationId },
			error,
		)
		return { data: null, error }
	}

	if (!data) {
		return { data: null, error: null }
	}

	return { data: { id: data.id }, error: null }
}

/**
 * Marks all unread notifications for the user. Caller must pass authenticated `userId`.
 */
export async function bulkMarkAllReadForUser(userId: string): Promise<{ marked: number; error: unknown }> {
	const readAt = new Date().toISOString()
	const { data, error } = await getAdmin()
		.from('notifications')
		.update({ read_at: readAt })
		.eq('user_id', userId)
		.is('read_at', null)
		.select('id')

	if (error) {
		logDatabaseError('notifications:bulkMarkAllReadForUser', { userId }, error)
		return { marked: 0, error }
	}

	return { marked: data?.length ?? 0, error: null }
}
