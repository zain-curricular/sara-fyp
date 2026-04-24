// ============================================================================
// Notifications — Services
// ============================================================================
//
// Server-only data access for the notifications feature. Each DAF performs a
// single Supabase query and returns { data, error } — never throws.
//
// Table relied on:
//   notifications — one row per notification event per user

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { NotificationRecord } from "@/lib/features/notifications/types";

// ----------------------------------------------------------------------------
// List notifications
// ----------------------------------------------------------------------------

/**
 * Returns notifications for a user, newest-first.
 * Pass onlyUnread=true to filter to unread only.
 */
export async function listNotifications(
	userId: string,
	onlyUnread = false,
): Promise<{ data: NotificationRecord[] | null; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	let query = supabase
		.from("notifications")
		.select("id, user_id, type, title, body, entity_type, entity_id, read_at, created_at")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(100);

	if (onlyUnread) {
		query = query.is("read_at", null);
	}

	const { data, error } = await query;

	if (error) return { data: null, error };

	const records: NotificationRecord[] = (data ?? []).map((row) => ({
		id: row.id as string,
		userId: row.user_id as string,
		type: row.type as string,
		title: row.title as string,
		body: (row.body as string | null) ?? null,
		entityType: (row.entity_type as string | null) ?? null,
		entityId: (row.entity_id as string | null) ?? null,
		readAt: (row.read_at as string | null) ?? null,
		createdAt: row.created_at as string,
	}));

	return { data: records, error: null };
}

// ----------------------------------------------------------------------------
// Mark one notification as read
// ----------------------------------------------------------------------------

/** Marks a single notification as read — verifies user ownership to prevent BOLA. */
export async function markNotificationRead(
	notificationId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase
		.from("notifications")
		.update({ read_at: new Date().toISOString() })
		.eq("id", notificationId)
		.eq("user_id", userId)
		.is("read_at", null);

	return { error: error ?? null };
}

// ----------------------------------------------------------------------------
// Mark all notifications as read
// ----------------------------------------------------------------------------

/** Marks every unread notification as read for a user. */
export async function markAllNotificationsRead(
	userId: string,
): Promise<{ error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { error } = await supabase
		.from("notifications")
		.update({ read_at: new Date().toISOString() })
		.eq("user_id", userId)
		.is("read_at", null);

	return { error: error ?? null };
}

// ----------------------------------------------------------------------------
// Get unread count
// ----------------------------------------------------------------------------

/** Returns the count of unread notifications for a user. */
export async function getUnreadCount(
	userId: string,
): Promise<{ data: number; error: unknown }> {
	const supabase = await createServerSupabaseClient();

	const { count, error } = await supabase
		.from("notifications")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId)
		.is("read_at", null);

	if (error) return { data: 0, error };
	return { data: count ?? 0, error: null };
}
