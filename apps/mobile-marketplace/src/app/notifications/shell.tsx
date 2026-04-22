// ============================================================================
// Notifications Shell
// ============================================================================
//
// Full-page notification inbox (Wireframe Variant B). Left rail: category
// filter list + delivery preferences summary. Right: notification stream
// grouped by date (Today / Yesterday / Earlier) with "mark all read" action.
//
// All data is placeholder — no notifications API exists yet.

"use client";

import { useState } from "react";
import {
	Bell,
	Gavel,
	MessageSquare,
	Package,
	ShieldCheck,
	Star,
	CreditCard,
} from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

type NotifCategory = "all" | "bids" | "orders" | "chats" | "reviews" | "warranty" | "system";

type Notif = {
	id: string;
	type: NotifCategory;
	icon: React.ElementType;
	title: string;
	sub: string;
	time: string;
	group: "today" | "yesterday" | "earlier";
	unread: boolean;
	cta: string;
};

const MOCK_NOTIFS: Notif[] = [
	{
		id: "n1",
		type: "bids",
		icon: Gavel,
		title: "You were outbid on iPhone 14 Pro",
		sub: "New bid: $532 · 3 minutes left",
		time: "just now",
		group: "today",
		unread: true,
		cta: "Counter-bid",
	},
	{
		id: "n2",
		type: "orders",
		icon: Package,
		title: "Order shipped — iPhone 13 Pro",
		sub: "DHL 4412-8821-00 · arrives Thursday",
		time: "2h ago",
		group: "today",
		unread: true,
		cta: "Track",
	},
	{
		id: "n3",
		type: "chats",
		icon: MessageSquare,
		title: "julia_k replied to your message",
		sub: '"here — super minor, camera bump…"',
		time: "2h ago",
		group: "today",
		unread: true,
		cta: "Reply",
	},
	{
		id: "n4",
		type: "reviews",
		icon: Star,
		title: "You received a new review",
		sub: "5★ from @nico_o · \"great comms, fast ship\"",
		time: "yesterday",
		group: "yesterday",
		unread: false,
		cta: "Read",
	},
	{
		id: "n5",
		type: "warranty",
		icon: ShieldCheck,
		title: "Warranty claim accepted",
		sub: "Drop-off confirmed · FixLab Altona · Apr 18",
		time: "Apr 18",
		group: "earlier",
		unread: false,
		cta: "View",
	},
	{
		id: "n6",
		type: "system",
		icon: CreditCard,
		title: "Subscription renews May 12",
		sub: "PRO plan · $49/mo",
		time: "Apr 17",
		group: "earlier",
		unread: false,
		cta: "Manage",
	},
];

const CATEGORIES: { key: NotifCategory; label: string; count: number }[] = [
	{ key: "all", label: "All", count: 12 },
	{ key: "bids", label: "Bids & auctions", count: 5 },
	{ key: "orders", label: "Orders", count: 3 },
	{ key: "chats", label: "Chats", count: 2 },
	{ key: "reviews", label: "Reviews", count: 1 },
	{ key: "warranty", label: "Warranty", count: 1 },
	{ key: "system", label: "System", count: 0 },
];

const GROUPS: { key: Notif["group"]; label: string }[] = [
	{ key: "today", label: "Today" },
	{ key: "yesterday", label: "Yesterday" },
	{ key: "earlier", label: "Earlier" },
];

// ----------------------------------------------------------------------------
// Notification row
// ----------------------------------------------------------------------------

function NotifRow({ notif }: { notif: Notif }) {
	const Icon = notif.icon;
	return (
		<Card
			size="sm"
			className={cn(
				"transition-colors",
				notif.unread && "border-primary/20 bg-primary/[0.03]",
			)}
		>
			<CardContent className="flex items-start gap-3 py-3">
				<div
					className={cn(
						"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
						notif.unread ? "bg-primary/10" : "bg-muted",
					)}
				>
					<Icon
						className={cn("size-4", notif.unread ? "text-primary" : "text-muted-foreground")}
						aria-hidden
					/>
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<p className={cn("text-sm", notif.unread ? "font-semibold" : "font-medium")}>
							{notif.title}
						</p>
						<div className="flex shrink-0 items-center gap-1.5">
							{notif.unread && (
								<span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />
							)}
							<span className="text-[10px] text-muted-foreground">{notif.time}</span>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">{notif.sub}</p>
				</div>

				<Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
					{notif.cta}
				</Button>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Full-page notification inbox with sidebar category filter. */
export default function NotificationsShell() {
	const [category, setCategory] = useState<NotifCategory>("all");
	const [allRead, setAllRead] = useState(false);

	const unreadCount = MOCK_NOTIFS.filter((n) => n.unread).length;

	const visible = MOCK_NOTIFS.filter(
		(n) => category === "all" || n.type === category,
	).map((n) => ({ ...n, unread: allRead ? false : n.unread }));

	return (
		<div container-id="notifications-shell" className="flex flex-col gap-5">

			{/* Header */}
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
					{!allRead && unreadCount > 0 && (
						<Badge variant="default" className="rounded-sm">
							{unreadCount} unread
						</Badge>
					)}
				</div>
				{!allRead && unreadCount > 0 && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setAllRead(true)}
					>
						Mark all read ✓
					</Button>
				)}
			</header>

			{/* Two-column layout */}
			<div
				container-id="notifications-grid"
				className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]"
			>

				{/* ── Left rail ── */}
				<div container-id="notifications-sidebar" className="flex flex-col gap-4">

					{/* Categories */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-sm text-muted-foreground">Categories</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0.5">
							{CATEGORIES.map((cat) => (
								<button
									key={cat.key}
									type="button"
									onClick={() => setCategory(cat.key)}
									className={cn(
										"flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
										category === cat.key
											? "bg-foreground text-background font-semibold"
											: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
									)}
								>
									<span>{cat.label}</span>
									<span className="tabular-nums text-xs">{cat.count}</span>
								</button>
							))}
						</CardContent>
					</Card>

					{/* Delivery settings summary */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-sm text-muted-foreground">Delivery</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{[
								{ label: "Push", on: true },
								{ label: "Email", on: true },
								{ label: "SMS", on: false },
							].map((d) => (
								<div key={d.label} className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{d.label}</span>
									<Badge
										variant={d.on ? "default" : "secondary"}
										className="rounded-sm text-[9px]"
									>
										{d.on ? "on" : "off"}
									</Badge>
								</div>
							))}
							<Separator />
							<a
								href="#"
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									"w-full justify-start text-xs",
								)}
							>
								⚙ Settings
							</a>
						</CardContent>
					</Card>
				</div>

				{/* ── Notification stream ── */}
				<div container-id="notifications-feed" className="flex flex-col gap-5">
					{GROUPS.map(({ key, label }) => {
						const group = visible.filter((n) => n.group === key);
						if (group.length === 0) return null;
						return (
							<div key={key} className="flex flex-col gap-2">
								<p className="text-xs font-medium text-muted-foreground">{label}</p>
								{group.map((notif) => (
									<NotifRow key={notif.id} notif={notif} />
								))}
							</div>
						);
					})}

					{visible.length === 0 && (
						<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
							<Bell className="size-8 text-muted-foreground/30" aria-hidden />
							<p className="text-sm font-medium">No notifications here.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
