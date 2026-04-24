// ============================================================================
// Notification Bell
// ============================================================================
//
// Client island rendered by SiteHeader. Fetches the unread notification count
// on mount and subscribes to Supabase Realtime for live updates. Shows a
// numbered badge when unread count > 0. Navigates to /notifications on click.
//
// Auth is optional — guests see a plain bell with no badge.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRealtimeNotifications } from "@/lib/features/notifications";
import type { NotificationRecord } from "@/lib/features/notifications";

/** Notification bell with live unread badge. Guest-safe. */
export function NotificationBell() {
	const [userId, setUserId] = useState<string | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);

	// Resolve auth state client-side
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();
		void supabase.auth.getSession().then(({ data: { session } }) => {
			setUserId(session?.user?.id ?? null);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUserId(session?.user?.id ?? null);
			if (!session) setUnreadCount(0);
		});

		return () => subscription.unsubscribe();
	}, []);

	// Fetch initial unread count when user becomes known
	useEffect(() => {
		if (!userId) return;

		void fetch("/api/notifications?unread=true")
			.then((r) => r.json())
			.then((body: unknown) => {
				if (
					body &&
					typeof body === "object" &&
					"ok" in body &&
					body.ok &&
					"data" in body &&
					body.data &&
					typeof body.data === "object" &&
					"unreadCount" in body.data
				) {
					setUnreadCount((body.data as { unreadCount: number }).unreadCount);
				}
			})
			.catch(() => {
				// Non-critical — badge simply stays at 0
			});
	}, [userId]);

	// Increment count on each incoming realtime notification
	const handleNewNotification = useCallback((_notification: NotificationRecord) => {
		setUnreadCount((v) => v + 1);
	}, []);

	useRealtimeNotifications(userId, handleNewNotification);

	return (
		<Link
			href="/notifications"
			className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
			aria-label={
				unreadCount > 0
					? `Notifications — ${unreadCount} unread`
					: "Notifications"
			}
		>
			<Bell className="size-4" />
			{unreadCount > 0 && (
				<span
					aria-hidden
					className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground"
				>
					{unreadCount > 99 ? "99+" : unreadCount}
				</span>
			)}
		</Link>
	);
}
