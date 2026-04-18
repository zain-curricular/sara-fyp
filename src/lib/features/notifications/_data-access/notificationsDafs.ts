// ============================================================================
// Notifications — data access (service-role client)
// ============================================================================
//
// Security: `getAdmin()` bypasses RLS. Callers must pass the authenticated
// `userId` from services/routes and never trust client-supplied user ids.
//
// Observability: DB failures are logged + captured once here (not in services).

import * as Sentry from '@sentry/nextjs'

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { NotificationRow } from '@/lib/supabase/database.types'

const notificationCols =
	'id, user_id, type, title, body, entity_type, entity_id, read_at, created_at' as const

function captureDbFailure(operation: string, context: Record<string, unknown>, error: unknown): void {
	logDatabaseError(operation, context, error)
	Sentry.captureException(error instanceof Error ? error : new Error(`${operation} failed`), {
		extra: { ...context, operation },
	})
}

export type PaginatedNotifications = {
	data: NotificationRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown | null
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
		captureDbFailure('notifications:listNotificationsForUser', { userId, limit, offset, unreadFirst }, error)
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
): Promise<{ count: number; error: unknown | null }> {
	const { error, count } = await getAdmin()
		.from('notifications')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null)

	if (error) {
		captureDbFailure('notifications:countUnreadNotificationsForUser', { userId }, error)
		return { count: 0, error }
	}

	return { count: count ?? 0, error: null }
}

/**
 * Marks one notification read (idempotent: already-read rows still return `id`).
 * Caller must ensure `userId` is the authenticated user.
 */
export async function updateNotificationReadForUser(
	userId: string,
	notificationId: string,
): Promise<{ data: { id: string } | null; error: unknown | null }> {
	const readAt = new Date().toISOString()

	const { data: updated, error: upErr } = await getAdmin()
		.from('notifications')
		.update({ read_at: readAt })
		.eq('id', notificationId)
		.eq('user_id', userId)
		.is('read_at', null)
		.select('id')
		.maybeSingle()

	if (upErr) {
		captureDbFailure('notifications:updateNotificationReadForUser', { userId, notificationId }, upErr)
		return { data: null, error: upErr }
	}

	if (updated) {
		return { data: { id: updated.id }, error: null }
	}

	const { data: row, error: fetchErr } = await getAdmin()
		.from('notifications')
		.select('id, read_at')
		.eq('id', notificationId)
		.eq('user_id', userId)
		.maybeSingle()

	if (fetchErr) {
		captureDbFailure('notifications:updateNotificationReadForUser:fetch', { userId, notificationId }, fetchErr)
		return { data: null, error: fetchErr }
	}

	if (row?.read_at != null) {
		return { data: { id: row.id }, error: null }
	}

	return { data: null, error: null }
}

/**
 * Marks all unread notifications for the user. Caller must pass authenticated `userId`.
 * Uses RPC for an exact affected-row count without returning every id.
 */
export async function bulkMarkAllReadForUser(
	userId: string,
): Promise<{ marked: number; error: unknown | null }> {
	const { data, error } = await getAdmin().rpc('mark_all_notifications_read', {
		p_user_id: userId,
	})

	if (error) {
		captureDbFailure('notifications:bulkMarkAllReadForUser', { userId }, error)
		return { marked: 0, error }
	}

	const marked = typeof data === 'number' ? data : 0
	return { marked, error: null }
}
