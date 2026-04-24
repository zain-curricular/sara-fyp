// ============================================================================
// Messages Shell
// ============================================================================
//
// Thread-per-listing chat inbox (Wireframe Variant B). Desktop: 3-column grid
// (conversation list | message thread | listing context rail). Mobile: stacked
// list → thread (thread hidden until a conversation is selected).
//
// All data is placeholder — no messaging API exists yet. Connect the real
// Supabase Realtime channel when the messaging feature ships.

"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, Paperclip, Send, X } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

type Conversation = {
	id: string;
	initials: string;
	handle: string;
	preview: string;
	time: string;
	item: string;
	price: string;
	status: "escrow" | "negotiating" | "shipped" | "closed";
	unread: number;
	orderId: string | null;
};

type Message = {
	id: string;
	from: "me" | "them";
	text: string;
	time: string;
	imageUrl?: string;
};

const MOCK_CONVOS: Conversation[] = [
	{
		id: "c1",
		initials: "JK",
		handle: "julia_k",
		preview: "here — barely any wear, fitment confirmed for your model",
		time: "2m",
		item: "Alternator · Toyota Corolla 2019",
		price: "Rs 18,500",
		status: "escrow",
		unread: 2,
		orderId: "A-9421",
	},
	{
		id: "c2",
		initials: "NO",
		handle: "nico_o",
		preview: "yes, mechanic-tested last week · all connections intact",
		time: "1h",
		item: "Brake Disc Set · Honda Civic",
		price: "Rs 7,200",
		status: "negotiating",
		unread: 1,
		orderId: null,
	},
	{
		id: "c3",
		initials: "RA",
		handle: "ra_2",
		preview: "shipped! tracking number attached.",
		time: "Apr 14",
		item: "Head Gasket · Suzuki Swift",
		price: "Rs 4,800",
		status: "shipped",
		unread: 0,
		orderId: "A-9388",
	},
	{
		id: "c4",
		initials: "JA",
		handle: "jae_k",
		preview: "thanks for the smooth transaction!",
		time: "Apr 11",
		item: "Radiator Fan · Hyundai Elantra",
		price: "Rs 3,500",
		status: "closed",
		unread: 0,
		orderId: "A-9212",
	},
];

const MOCK_THREAD: Message[] = [
	{ id: "m1", from: "them", text: "hi! shipped the part this morning. tracking TCS 4412-8821-00", time: "Apr 19 · 14:02" },
	{ id: "m2", from: "me", text: "thanks! quick question — how bad is the surface corrosion? can I see a photo?", time: "14:08" },
	{ id: "m3", from: "them", text: "here — barely any wear, fitment confirmed for your model", time: "14:11" },
];

const STATUS_LABELS: Record<Conversation["status"], string> = {
	escrow: "in escrow",
	negotiating: "negotiating",
	shipped: "shipped",
	closed: "closed",
};

// ----------------------------------------------------------------------------
// Conversation row
// ----------------------------------------------------------------------------

function ConvoRow({
	convo,
	active,
	onClick,
}: {
	convo: Conversation;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
				active ? "bg-primary/5" : "hover:bg-accent/40",
			)}
		>
			{/* Avatar */}
			<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
				{convo.initials}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex items-center justify-between gap-2">
					<span className="truncate text-sm font-semibold">@{convo.handle}</span>
					<span className="shrink-0 text-[10px] text-muted-foreground">{convo.time}</span>
				</div>
				<p className="truncate text-xs text-muted-foreground">{convo.preview}</p>
				<div className="flex items-center gap-1.5">
					<Badge
						variant={convo.status === "escrow" ? "default" : "secondary"}
						className="rounded-sm text-[9px]"
					>
						{STATUS_LABELS[convo.status]}
					</Badge>
					{convo.unread > 0 && (
						<span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
							{convo.unread}
						</span>
					)}
				</div>
			</div>
		</button>
	);
}

// ----------------------------------------------------------------------------
// Message bubble
// ----------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: Message }) {
	const isMe = msg.from === "me";
	return (
		<div className={cn("flex items-end gap-2", isMe && "flex-row-reverse")}>
			{!isMe && (
				<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
					JK
				</div>
			)}
			<div
				className={cn(
					"max-w-[70%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
					isMe
						? "rounded-br-sm bg-primary text-primary-foreground"
						: "rounded-bl-sm bg-muted/60 text-foreground",
				)}
			>
				{msg.text}
				<p
					className={cn(
						"mt-0.5 text-[10px]",
						isMe ? "text-primary-foreground/60" : "text-muted-foreground",
					)}
				>
					{msg.time}
				</p>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Chat inbox — conversation list + active thread + listing rail. */
export default function MessagesShell() {
	const [activeId, setActiveId] = useState<string>("c1");
	const [reply, setReply] = useState("");

	const active = MOCK_CONVOS.find((c) => c.id === activeId) ?? MOCK_CONVOS[0]!;
	const totalUnread = MOCK_CONVOS.reduce((n, c) => n + c.unread, 0);

	return (
		<div container-id="messages-shell" className="flex flex-col gap-4">

			{/* Header */}
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
					{totalUnread > 0 && (
						<Badge variant="default" className="rounded-sm">
							{totalUnread} unread
						</Badge>
					)}
				</div>
				<div className="flex gap-2">
					<Badge variant="secondary" className="rounded-sm">Active ({MOCK_CONVOS.filter(c => c.status !== "closed").length})</Badge>
					<Badge variant="outline" className="rounded-sm">Closed</Badge>
				</div>
			</header>

			{/* 3-column grid on desktop, stacked on mobile */}
			<div
				container-id="messages-grid"
				className="overflow-hidden rounded-xl border border-border lg:grid lg:h-[600px] lg:grid-cols-[280px_minmax(0,1fr)_240px]"
			>

				{/* ── Conversation list ── */}
				<div
					container-id="messages-list"
					className={cn(
						"flex flex-col border-border lg:border-r lg:overflow-y-auto",
						activeId ? "hidden lg:flex" : "flex",
					)}
				>
					<div className="border-b border-border p-3">
						<Input placeholder="Search messages…" className="h-8 text-xs" />
					</div>
					{MOCK_CONVOS.map((c, i) => (
						<div key={c.id}>
							{i > 0 && <Separator />}
							<ConvoRow
								convo={c}
								active={activeId === c.id}
								onClick={() => setActiveId(c.id)}
							/>
						</div>
					))}
				</div>

				{/* ── Active thread ── */}
				<div
					container-id="messages-thread"
					className={cn(
						"flex flex-col border-border",
						activeId ? "flex" : "hidden lg:flex",
					)}
				>
					{/* Thread header */}
					<div className="flex items-center gap-3 border-b border-border px-4 py-3">
						<button
							type="button"
							className="text-muted-foreground lg:hidden"
							onClick={() => setActiveId("")}
							aria-label="Back to list"
						>
							<X className="size-4" />
						</button>
						<div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
							{active.initials}
						</div>
						<div className="flex min-w-0 flex-1 flex-col">
							<p className="text-sm font-semibold">@{active.handle}</p>
							<p className="text-xs text-muted-foreground truncate">
								re: {active.item}
								{active.orderId ? ` · order #${active.orderId}` : ""}
							</p>
						</div>
						<Badge
							variant={active.status === "escrow" ? "default" : "secondary"}
							className="shrink-0 rounded-sm text-[9px]"
						>
							{STATUS_LABELS[active.status]}
						</Badge>
					</div>

					{/* Messages */}
					<div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
						{MOCK_THREAD.map((msg) => (
							<MessageBubble key={msg.id} msg={msg} />
						))}
					</div>

					{/* Input bar */}
					<div className="flex items-center gap-2 border-t border-border p-3">
						<Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Attach file">
							<Paperclip className="size-4" />
						</Button>
						<Input
							value={reply}
							onChange={(e) => setReply(e.target.value)}
							placeholder="Type a reply…"
							className="flex-1"
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									setReply("");
								}
							}}
						/>
						<Button type="button" size="icon-sm" disabled={!reply.trim()} aria-label="Send">
							<Send className="size-4" />
						</Button>
					</div>
				</div>

				{/* ── Listing context rail ── */}
				<div
					container-id="messages-rail"
					className="hidden flex-col gap-3 border-l border-border p-4 lg:flex"
				>
					<p className="text-xs font-medium text-muted-foreground">About this chat</p>

					{/* Listing image placeholder */}
					<div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted/40">
						<ImageIcon className="size-8 text-muted-foreground/30" aria-hidden />
					</div>

					<div className="flex flex-col gap-1">
						<p className="text-sm font-semibold leading-snug">{active.item}</p>
						<p className="text-base font-bold tabular-nums text-primary">{active.price}</p>
					</div>

					<Link
						href={`/listings/placeholder`}
						className="rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium hover:bg-accent/40 transition-colors"
					>
						View listing ↗
					</Link>

					{active.orderId && (
						<>
							<Separator />
							<div className="flex flex-col gap-1">
								<p className="text-xs text-muted-foreground">Order #{active.orderId}</p>
								<p className="text-xs font-medium">{STATUS_LABELS[active.status]}</p>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{["Track", "Refund", "Report"].map((a) => (
									<button
										key={a}
										type="button"
										className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium hover:bg-accent/40"
										disabled
									>
										{a}
									</button>
								))}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
