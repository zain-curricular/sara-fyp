// ============================================================================
// Notifications — Types
// ============================================================================
//
// Domain types for the notifications feature. NotificationRecord maps to the
// `notifications` table in Supabase. The `type` field is a free-form string
// so new notification categories (e.g. "mechanic", "dispute") can be added
// without schema changes.

/** A single notification row as returned by the notifications service. */
export type NotificationRecord = {
	id: string;
	userId: string;
	type: string;
	title: string;
	body: string | null;
	entityType: string | null;
	entityId: string | null;
	readAt: string | null;
	createdAt: string;
};

/** Envelope returned by the notification list API. */
export type NotificationsListPayload = {
	notifications: NotificationRecord[];
	total: number;
	unreadCount: number;
};
