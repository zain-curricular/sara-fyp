// ============================================================================
// Messages Shell
// ============================================================================
//
// Two-panel real-time chat inbox. Desktop: side-by-side conversation list and
// message thread. Mobile: stacked — list slides to thread on conversation
// select.
//
// Data flow:
//   1. SSR initial conversations arrive as props.
//   2. useMessages fetches thread on conversation select.
//   3. useRealtimeMessages subscribes to Supabase Realtime for live appends.
//   4. useSendMessage POSTs new messages; realtime delivers them to both sides.
//   5. markConversationRead called when thread opens.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	ExternalLink,
	MessageSquareDashed,
	Paperclip,
	Send,
} from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";
import { Skeleton } from "@/components/primitives/skeleton";
import { cn } from "@/lib/utils";

import type { Conversation, Message } from "@/lib/features/messaging";
import {
	useMarkConversationRead,
	useMessages,
	useRealtimeMessages,
	useSendMessage,
} from "@/lib/features/messaging";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type MessagesShellProps = {
	initialConversations: Conversation[];
	currentUserId: string;
	/** Pre-selected conversation ID (from /messages/[conversationId] redirect). */
	preselectedId?: string;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatTime(iso: string): string {
	try {
		return formatDistanceToNow(new Date(iso), { addSuffix: false });
	} catch {
		return "";
	}
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0] ?? "")
		.join("")
		.toUpperCase();
}

// ----------------------------------------------------------------------------
// ConversationRow
// ----------------------------------------------------------------------------

function ConversationRow({
	convo,
	active,
	currentUserId,
	onClick,
}: {
	convo: Conversation;
	active: boolean;
	currentUserId: string;
	onClick: () => void;
}) {
	const isBuyer = convo.buyerId === currentUserId;
	const unread = isBuyer ? convo.buyerUnreadCount : convo.sellerUnreadCount;
	const initials = getInitials(convo.otherParty.fullName);

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
				active ? "bg-primary/5" : "hover:bg-accent/40",
			)}
		>
			{/* Avatar — initials only to avoid next/image overhead in chat lists */}
			<div
				className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold"
				title={convo.otherParty.fullName}
				aria-label={convo.otherParty.fullName}
			>
				{initials}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex items-center justify-between gap-2">
					<span className="truncate text-sm font-semibold">
						{convo.otherParty.fullName}
					</span>
					<span className="shrink-0 text-[10px] text-muted-foreground">
						{formatTime(convo.lastMessageAt)}
					</span>
				</div>

				{convo.listing && (
					<p className="truncate text-[10px] text-muted-foreground">
						re: {convo.listing.title}
					</p>
				)}

				<div className="flex items-center justify-between gap-2">
					<p className="truncate text-xs text-muted-foreground">
						{convo.lastMessagePreview || "No messages yet"}
					</p>
					{unread > 0 && (
						<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
							{unread}
						</span>
					)}
				</div>
			</div>
		</button>
	);
}

// ----------------------------------------------------------------------------
// MessageBubble
// ----------------------------------------------------------------------------

function MessageBubble({
	msg,
	isMe,
}: {
	msg: Message;
	isMe: boolean;
}) {
	return (
		<div className={cn("flex items-end gap-2", isMe && "flex-row-reverse")}>
			<div
				className={cn(
					"max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
					isMe
						? "rounded-br-sm bg-primary text-primary-foreground"
						: "rounded-bl-sm bg-muted/70 text-foreground",
				)}
			>
				<p className="whitespace-pre-wrap break-words">{msg.body}</p>

				{msg.attachments.length > 0 && (
					<div className="mt-1.5 flex flex-col gap-1">
						{msg.attachments.map((url, i) => (
							<a
								key={i}
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(
									"flex items-center gap-1 text-xs underline",
									isMe ? "text-primary-foreground/80" : "text-muted-foreground",
								)}
							>
								<Paperclip className="size-3" />
								Attachment {i + 1}
							</a>
						))}
					</div>
				)}

				<p
					className={cn(
						"mt-0.5 text-[10px]",
						isMe ? "text-primary-foreground/60" : "text-muted-foreground",
					)}
				>
					{formatTime(msg.createdAt)}
					{msg.readAt && isMe && " · read"}
				</p>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Thread panel
// ----------------------------------------------------------------------------

function ThreadPanel({
	conversation,
	currentUserId,
	onBack,
}: {
	conversation: Conversation;
	currentUserId: string;
	onBack: () => void;
}) {
	const [draft, setDraft] = useState("");
	const bottomRef = useRef<HTMLDivElement>(null);

	const { messages, isLoading, appendMessage } = useMessages(conversation.id);
	const { send, isSending } = useSendMessage(conversation.id);
	const markRead = useMarkConversationRead();

	// Mark conversation read on open
	useEffect(() => {
		void markRead(conversation.id);
	}, [conversation.id, markRead]);

	// Realtime subscription
	useRealtimeMessages(
		conversation.id,
		useCallback(
			(msg: Message) => {
				appendMessage(msg);
			},
			[appendMessage],
		),
	);

	// Scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async () => {
		const body = draft.trim();
		if (!body || isSending) return;
		setDraft("");
		await send({ body, attachments: [] });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void handleSend();
		}
	};

	return (
		<div container-id="messages-thread" className="flex flex-col">
			{/* Thread header */}
			<div className="flex items-center gap-3 border-b border-border px-4 py-3">
				<button
					type="button"
					className="shrink-0 text-muted-foreground lg:hidden"
					onClick={onBack}
					aria-label="Back to list"
				>
					<ArrowLeft className="size-4" />
				</button>

				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
					{getInitials(conversation.otherParty.fullName)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col">
					<p className="text-sm font-semibold">{conversation.otherParty.fullName}</p>
					{conversation.listing && (
						<p className="truncate text-xs text-muted-foreground">
							re: {conversation.listing.title}
						</p>
					)}
				</div>

				{conversation.listingId && (
					<Link
						href={`/listings/${conversation.listingId}`}
						className="shrink-0 text-muted-foreground hover:text-foreground"
						aria-label="View listing"
					>
						<ExternalLink className="size-4" />
					</Link>
				)}
			</div>

			{/* Messages */}
			<div
				container-id="messages-thread-body"
				className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 min-h-0"
				style={{ maxHeight: "calc(100% - 118px)" }}
			>
				{isLoading && (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-10 w-2/3" />
						<Skeleton className="ml-auto h-10 w-1/2" />
						<Skeleton className="h-10 w-3/5" />
					</div>
				)}

				{!isLoading && messages.length === 0 && (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
						<MessageSquareDashed className="size-8 text-muted-foreground/30" aria-hidden />
						<p className="text-sm text-muted-foreground">
							No messages yet. Say hello!
						</p>
					</div>
				)}

				{messages.map((msg) => (
					<MessageBubble
						key={msg.id}
						msg={msg}
						isMe={msg.senderId === currentUserId}
					/>
				))}

				<div ref={bottomRef} />
			</div>

			{/* Input bar */}
			<div className="flex items-center gap-2 border-t border-border p-3">
				<Input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type a message…"
					className="flex-1"
					disabled={isSending}
					autoComplete="off"
				/>
				<Button
					type="button"
					size="icon-sm"
					onClick={() => void handleSend()}
					disabled={!draft.trim() || isSending}
					aria-label="Send message"
				>
					<Send className="size-4" />
				</Button>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Empty thread placeholder
// ----------------------------------------------------------------------------

function EmptyThread() {
	return (
		<div
			container-id="messages-thread-empty"
			className="hidden flex-1 flex-col items-center justify-center gap-3 text-center lg:flex"
		>
			<MessageSquareDashed className="size-10 text-muted-foreground/20" aria-hidden />
			<p className="text-sm text-muted-foreground">
				Select a conversation to start chatting
			</p>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Real-time two-panel messaging inbox. */
export default function MessagesShell({
	initialConversations,
	currentUserId,
	preselectedId,
}: MessagesShellProps) {
	const searchParams = useSearchParams();

	const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
	const [activeId, setActiveId] = useState<string | null>(
		preselectedId ?? searchParams.get("conversation") ?? null,
	);

	const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

	const totalUnread = conversations.reduce((n, c) => {
		const mine = c.buyerId === currentUserId ? c.buyerUnreadCount : c.sellerUnreadCount;
		return n + mine;
	}, 0);

	const selectConversation = (id: string) => {
		setActiveId(id);
		// Reset unread count locally
		setConversations((prev) =>
			prev.map((c) => {
				if (c.id !== id) return c;
				return c.buyerId === currentUserId
					? { ...c, buyerUnreadCount: 0 }
					: { ...c, sellerUnreadCount: 0 };
			}),
		);
	};

	return (
		<div container-id="messages-shell" className="flex flex-col gap-4">

			{/* Page header */}
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Messages</h1>
					{totalUnread > 0 && (
						<Badge variant="default" className="rounded-sm">
							{totalUnread} unread
						</Badge>
					)}
				</div>
			</header>

			{/* Two-panel grid */}
			<div
				container-id="messages-grid"
				className="overflow-hidden rounded-xl border border-border lg:grid lg:h-[600px] lg:grid-cols-[300px_minmax(0,1fr)]"
			>

				{/* Conversation list */}
				<div
					container-id="messages-list"
					className={cn(
						"flex flex-col border-border lg:border-r lg:overflow-y-auto",
						activeId ? "hidden lg:flex" : "flex",
					)}
				>
					{conversations.length === 0 ? (
						<div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
							<MessageSquareDashed className="size-8 text-muted-foreground/30" aria-hidden />
							<p className="text-sm text-muted-foreground">No conversations yet.</p>
							<p className="text-xs text-muted-foreground">
								Contact a seller from any listing to start chatting.
							</p>
						</div>
					) : (
						conversations.map((c, i) => (
							<div key={c.id}>
								{i > 0 && <Separator />}
								<ConversationRow
									convo={c}
									active={activeId === c.id}
									currentUserId={currentUserId}
									onClick={() => selectConversation(c.id)}
								/>
							</div>
						))
					)}
				</div>

				{/* Thread panel / empty state */}
				{activeConversation ? (
					<ThreadPanel
						conversation={activeConversation}
						currentUserId={currentUserId}
						onBack={() => setActiveId(null)}
					/>
				) : (
					<EmptyThread />
				)}
			</div>
		</div>
	);
}
