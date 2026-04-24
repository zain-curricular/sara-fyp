// ============================================================================
// Notifications Shell
// ============================================================================
//
// Full-page notification inbox. Left: category filter tabs. Right: notification
// stream grouped by date.
//
// Data flow:
//   1. SSR initial notifications arrive as props.
//   2. useRealtimeNotifications subscribes to Supabase Realtime for live inserts.
//   3. Clicking a notification marks it read optimistically, then confirms via API.
//   4. "Mark all read" calls useMarkAllRead and updates local state.

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
	Bell,
	CreditCard,
	Gavel,
	MessageSquare,
	Package,
	ShieldCheck,
	Star,
	Wrench,
} from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

import type { NotificationRecord } from "@/lib/features/notifications";
import {
	useMarkAllRead,
	useMarkNotificationRead,
	useRealtimeNotifications,
	useUnreadCount,
} from "@/lib/features/notifications";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type NotificationsShellProps = {
	initialNotifications: NotificationRecord[];
	currentUserId: string;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

type FilterKey = "all" | "unread";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
	bid: Gavel,
	auction: Gavel,
	order: Package,
	message: MessageSquare,
	chat: MessageSquare,
	review: Star,
	warranty: ShieldCheck,
	mechanic: Wrench,
	payment: CreditCard,
	system: Bell,
};

function getIcon(type: string): React.ElementType {
	const key = Object.keys(NOTIFICATION_ICONS).find((k) => type.toLowerCase().includes(k));
	return key ? NOTIFICATION_ICONS[key]! : Bell;
}

function formatTime(iso: string): string {
	try {
		return formatDistanceToNow(new Date(iso), { addSuffix: true });
	} catch {
		return "";
	}
}

function groupByDate(notifications: NotificationRecord[]): {
	today: NotificationRecord[];
	yesterday: NotificationRecord[];
	earlier: NotificationRecord[];
} {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const yesterdayStart = todayStart - 86400000;

	const today: NotificationRecord[] = [];
	const yesterday: NotificationRecord[] = [];
	const earlier: NotificationRecord[] = [];

	for (const n of notifications) {
		const ts = new Date(n.createdAt).getTime();
		if (ts >= todayStart) {
			today.push(n);
		} else if (ts >= yesterdayStart) {
			yesterday.push(n);
		} else {
			earlier.push(n);
		}
	}

	return { today, yesterday, earlier };
}

// ----------------------------------------------------------------------------
// NotificationRow
// ----------------------------------------------------------------------------

/**
 * Renders the correct Lucide icon for a notification type inside a circular badge.
 * The icon is looked up at render time using the module-level NOTIFICATION_ICONS map
 * and rendered via createElement to avoid the React Compiler "component in render" lint.
 */
function NotificationIcon({ type, isUnread }: { type: string; isUnread: boolean }) {
	const iconClass = cn("size-4", isUnread ? "text-primary" : "text-muted-foreground");
	const IconEl = getIcon(type);

	return (
		<div
			className={cn(
				"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
				isUnread ? "bg-primary/10" : "bg-muted",
			)}
		>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{(IconEl as any)({ className: iconClass, "aria-hidden": true })}
		</div>
	);
}

function NotificationRow({
	notification,
	onRead,
}: {
	notification: NotificationRecord;
	onRead: (id: string) => void;
}) {
	const router = useRouter();
	const isUnread = !notification.readAt;

	const handleClick = () => {
		if (isUnread) {
			onRead(notification.id);
		}
	};

	return (
		<Card
			size="sm"
			onClick={handleClick}
			className={cn(
				"transition-colors",
				isUnread && "border-primary/20 bg-primary/[0.03]",
				isUnread && "cursor-pointer hover:bg-accent/40",
			)}
		>
			<CardContent className="flex items-start gap-3 py-3">
				{/* Icon */}
				<NotificationIcon type={notification.type} isUnread={isUnread} />

				{/* Content */}
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<p className={cn("text-sm", isUnread ? "font-semibold" : "font-medium")}>
							{notification.title}
						</p>
						<div className="flex shrink-0 items-center gap-1.5">
							{isUnread && (
								<span
									className="size-1.5 rounded-full bg-primary"
									aria-label="Unread"
								/>
							)}
							<span className="text-[10px] text-muted-foreground">
								{formatTime(notification.createdAt)}
							</span>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">{notification.body}</p>
				</div>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// DateGroup
// ----------------------------------------------------------------------------

function DateGroup({
	label,
	notifications,
	onRead,
}: {
	label: string;
	notifications: NotificationRecord[];
	onRead: (id: string) => void;
}) {
	if (notifications.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			{notifications.map((n) => (
				<NotificationRow key={n.id} notification={n} onRead={onRead} />
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Full-page notification inbox with date grouping, filter tabs, and realtime. */
export default function NotificationsShell({
	initialNotifications,
	currentUserId,
}: NotificationsShellProps) {
	const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
	const [filter, setFilter] = useState<FilterKey>("all");

	const unreadCount = useUnreadCount(notifications);
	const { markRead } = useMarkNotificationRead();
	const { markAllRead, isPending: isMarkingAll } = useMarkAllRead();

	// Prepend incoming realtime notifications
	useRealtimeNotifications(
		currentUserId,
		useCallback((n: NotificationRecord) => {
			setNotifications((prev) => [n, ...prev]);
		}, []),
	);

	// Optimistic read
	const handleMarkRead = async (id: string) => {
		setNotifications((prev) =>
			prev.map((n) =>
				n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
			),
		);
		await markRead(id);
	};

	const handleMarkAllRead = async () => {
		const now = new Date().toISOString();
		setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
		await markAllRead();
	};

	const visible =
		filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

	const { today, yesterday, earlier } = groupByDate(visible);
	const isEmpty = visible.length === 0;

	return (
		<div container-id="notifications-shell" className="flex flex-col gap-5">

			{/* Page header */}
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
					{unreadCount > 0 && (
						<Badge variant="default" className="rounded-sm">
							{unreadCount} unread
						</Badge>
					)}
				</div>
				{unreadCount > 0 && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void handleMarkAllRead()}
						disabled={isMarkingAll}
					>
						Mark all read
					</Button>
				)}
			</header>

			{/* Two-column layout */}
			<div
				container-id="notifications-grid"
				className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]"
			>

				{/* Left rail: filters + delivery summary */}
				<div container-id="notifications-sidebar" className="flex flex-col gap-4">
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-sm text-muted-foreground">Filter</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0.5">
							{(["all", "unread"] as const).map((key) => (
								<button
									key={key}
									type="button"
									onClick={() => setFilter(key)}
									className={cn(
										"flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
										filter === key
											? "bg-foreground text-background font-semibold"
											: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
									)}
								>
									<span>{key === "all" ? "All" : "Unread"}</span>
									<span className="tabular-nums text-xs">
										{key === "all" ? notifications.length : unreadCount}
									</span>
								</button>
							))}
						</CardContent>
					</Card>
				</div>

				{/* Notification stream */}
				<div container-id="notifications-feed" className="flex flex-col gap-5">
					{isEmpty ? (
						<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
							<Bell className="size-8 text-muted-foreground/30" aria-hidden />
							<p className="text-sm font-medium">
								{filter === "unread" ? "No unread notifications." : "You're all caught up!"}
							</p>
						</div>
					) : (
						<>
							<DateGroup label="Today" notifications={today} onRead={(id) => void handleMarkRead(id)} />
							<DateGroup label="Yesterday" notifications={yesterday} onRead={(id) => void handleMarkRead(id)} />
							<DateGroup label="Earlier" notifications={earlier} onRead={(id) => void handleMarkRead(id)} />
						</>
					)}
				</div>
			</div>
		</div>
	);
}
