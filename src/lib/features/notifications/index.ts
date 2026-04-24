// ============================================================================
// Notifications — Client Barrel
// ============================================================================
//
// Import from `@/lib/features/notifications` for types and hooks.
// Never import services from this barrel — they are server-only.

export type {
	NotificationRecord,
	NotificationsListPayload,
} from "./types";

export {
	useMarkAllRead,
	useMarkNotificationRead,
	useNotifications,
	useRealtimeNotifications,
	useUnreadCount,
} from "./hooks";
