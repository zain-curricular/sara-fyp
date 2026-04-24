// ============================================================================
// Notifications — Client Hooks
// ============================================================================
//
// React hooks for the notifications feature. Follows the same useState/useEffect
// pattern as the rest of the codebase hooks. Includes a Supabase Realtime
// subscription hook for live notification updates.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { NotificationRecord } from "@/lib/features/notifications/types";

// ----------------------------------------------------------------------------
// useNotifications
// ----------------------------------------------------------------------------

/** Fetches the authenticated user's notifications from GET /api/notifications. */
export function useNotifications(initial?: NotificationRecord[]) {
	const authFetch = useAuthenticatedFetch();

	const [notifications, setNotifications] = useState<NotificationRecord[]>(initial ?? []);
	const [isLoading, setIsLoading] = useState(initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => setNonce((v) => v + 1), []);

	useEffect(() => {
		if (initial !== undefined && nonce === 0) return;

		let cancelled = false;
		void (async () => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await authFetch<
					| { ok: true; data: { notifications: NotificationRecord[] } }
					| { ok: false; error: string }
				>("/api/notifications");
				if (cancelled) return;
				if (result.ok) {
					setNotifications(result.data.notifications);
				} else {
					setError(result.error);
				}
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load notifications");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [nonce, initial, authFetch]);

	return useMemo(
		() => ({ notifications, isLoading, error, refetch, setNotifications }),
		[notifications, isLoading, error, refetch],
	);
}

// ----------------------------------------------------------------------------
// useUnreadCount
// ----------------------------------------------------------------------------

/** Derived from useNotifications — returns count of unread notifications. */
export function useUnreadCount(notifications: NotificationRecord[]): number {
	return useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications]);
}

// ----------------------------------------------------------------------------
// useMarkNotificationRead
// ----------------------------------------------------------------------------

/** Calls POST /api/notifications/[id]/read with optimistic UI support. */
export function useMarkNotificationRead() {
	const authFetch = useAuthenticatedFetch();
	const [isPending, setIsPending] = useState(false);

	const markRead = useCallback(
		async (notificationId: string): Promise<boolean> => {
			setIsPending(true);
			try {
				const result = await authFetch<{ ok: boolean }>(
					`/api/notifications/${encodeURIComponent(notificationId)}/read`,
					{ method: "POST" },
				);
				return result.ok;
			} catch {
				return false;
			} finally {
				setIsPending(false);
			}
		},
		[authFetch],
	);

	return useMemo(() => ({ markRead, isPending }), [markRead, isPending]);
}

// ----------------------------------------------------------------------------
// useMarkAllRead
// ----------------------------------------------------------------------------

/** Calls POST /api/notifications/read-all. */
export function useMarkAllRead() {
	const authFetch = useAuthenticatedFetch();
	const [isPending, setIsPending] = useState(false);

	const markAllRead = useCallback(async (): Promise<boolean> => {
		setIsPending(true);
		try {
			const result = await authFetch<{ ok: boolean }>("/api/notifications/read-all", {
				method: "POST",
			});
			return result.ok;
		} catch {
			return false;
		} finally {
			setIsPending(false);
		}
	}, [authFetch]);

	return useMemo(() => ({ markAllRead, isPending }), [markAllRead, isPending]);
}

// ----------------------------------------------------------------------------
// useRealtimeNotifications
// ----------------------------------------------------------------------------

/**
 * Subscribes to Supabase Realtime INSERT events on the notifications table
 * filtered by user_id. Calls onNotification for each new row.
 */
export function useRealtimeNotifications(
	userId: string | null,
	onNotification: (notification: NotificationRecord) => void,
) {
	useEffect(() => {
		if (!userId) return;

		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`user-notifications:${userId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const row = payload.new as {
						id: string;
						user_id: string;
						type: string;
						title: string;
						body: string | null;
						entity_type: string | null;
						entity_id: string | null;
						read_at: string | null;
						created_at: string;
					};
					onNotification({
						id: row.id,
						userId: row.user_id,
						type: row.type,
						title: row.title,
						body: row.body ?? null,
						entityType: row.entity_type ?? null,
						entityId: row.entity_id ?? null,
						readAt: row.read_at ?? null,
						createdAt: row.created_at,
					});
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [userId, onNotification]);
}
