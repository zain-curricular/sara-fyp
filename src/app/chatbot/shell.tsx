// ============================================================================
// Chatbot Shell
// ============================================================================
//
// Full-page chat UI. Messages auto-scroll to bottom. User messages are
// right-aligned, assistant messages left-aligned with a bot icon.
// Citation chips appear below assistant messages. Session ID persisted
// in localStorage for anonymous users.
//
// Streaming: we await the full response for now (no streaming transport)
// and show a typing indicator while waiting.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";

import type { ChatMessage, Citation } from "@/lib/features/chatbot";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const SESSION_KEY = "shopsmart_chat_session_id";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ChatbotShellProps = {
	userId: string | null;
};

type MessageWithCitations = ChatMessage & {
	citations?: Citation[];
};

// ----------------------------------------------------------------------------
// Typing indicator
// ----------------------------------------------------------------------------

function TypingIndicator() {
	return (
		<div className="flex items-start gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
				<Bot className="size-4 text-primary" aria-hidden />
			</div>
			<div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-muted px-4 py-3">
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Message bubble
// ----------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: MessageWithCitations }) {
	const isUser = msg.role === "user";

	if (isUser) {
		return (
			<div className="flex items-start justify-end gap-3">
				<div className="max-w-[80%] rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm text-primary-foreground">
					{msg.content}
				</div>
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
					<User className="size-4 text-muted-foreground" aria-hidden />
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-start gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
				<Bot className="size-4 text-primary" aria-hidden />
			</div>
			<div className="flex max-w-[80%] flex-col gap-2">
				<div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3 text-sm leading-relaxed">
					{msg.content}
				</div>
				{msg.citations && msg.citations.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{msg.citations.map((c) => (
							<Link key={c.id} href={c.url}>
								<Badge
									variant="secondary"
									className="cursor-pointer rounded-sm text-[10px] hover:bg-primary/10"
								>
									{c.type === "listing" ? "Part: " : ""}
									{c.title}
								</Badge>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function ChatbotShell({ userId }: ChatbotShellProps) {
	const [messages, setMessages] = useState<MessageWithCitations[]>([
		{
			role: "assistant",
			content:
				"Hello! I'm ShopSmart's AI assistant. I can help you find spare parts, check compatibility, and answer questions about your orders. How can I help?",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Restore session from localStorage
	useEffect(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(SESSION_KEY);
			if (stored) setSessionId(stored);
		}
	}, []);

	// Auto-scroll to bottom
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	async function sendMessage() {
		const trimmed = input.trim();
		if (!trimmed || loading) return;

		const userMsg: MessageWithCitations = { role: "user", content: trimmed };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("/api/chatbot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: trimmed,
					sessionId: sessionId ?? undefined,
					userId: userId ?? undefined,
				}),
			});

			const json = await res.json();

			if (json.ok && json.data) {
				const { response, citations, sessionId: newSessionId } = json.data;

				// Persist session id
				if (newSessionId && newSessionId !== sessionId) {
					setSessionId(newSessionId);
					if (typeof window !== "undefined") {
						localStorage.setItem(SESSION_KEY, newSessionId);
					}
				}

				const assistantMsg: MessageWithCitations = {
					role: "assistant",
					content: response,
					citations: citations ?? [],
				};
				setMessages((prev) => [...prev, assistantMsg]);
			} else {
				setMessages((prev) => [
					...prev,
					{
						role: "assistant",
						content: "Sorry, something went wrong. Please try again.",
					},
				]);
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Connection error. Please check your internet and try again.",
				},
			]);
		} finally {
			setLoading(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function clearConversation() {
		setMessages([
			{
				role: "assistant",
				content: "Conversation cleared. How can I help you?",
			},
		]);
		setSessionId(null);
		if (typeof window !== "undefined") {
			localStorage.removeItem(SESSION_KEY);
		}
	}

	return (
		<div container-id="chatbot-page" className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col gap-0">

			{/* Header */}
			<div container-id="chatbot-header" className="flex items-center justify-between border-b pb-4">
				<div className="flex items-center gap-2.5">
					<div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
						<Bot className="size-5 text-primary" aria-hidden />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-semibold">ShopSmart Assistant</span>
						<span className="text-xs text-muted-foreground">AI-powered auto parts helper</span>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearConversation}
					className="gap-1.5 text-muted-foreground"
				>
					<Trash2 className="size-3.5" aria-hidden />
					Clear
				</Button>
			</div>

			<Separator />

			{/* Messages */}
			<div
				container-id="chatbot-messages"
				className="flex flex-1 flex-col gap-4 overflow-y-auto py-4"
				aria-live="polite"
				aria-label="Chat messages"
			>
				{messages.map((msg, i) => (
					<MessageBubble key={i} msg={msg} />
				))}
				{loading && <TypingIndicator />}
				<div ref={bottomRef} />
			</div>

			<Separator />

			{/* Input area */}
			<div container-id="chatbot-input" className="flex items-end gap-2 pt-4">
				<Card size="sm" className="flex-1">
					<CardContent className="p-0">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask about spare parts, compatibility, orders…"
							rows={1}
							disabled={loading}
							className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
							style={{ minHeight: "2.75rem", maxHeight: "8rem" }}
						/>
					</CardContent>
				</Card>
				<Button
					onClick={sendMessage}
					disabled={loading || !input.trim()}
					size="icon"
					className="shrink-0"
					aria-label="Send message"
				>
					<Send className="size-4" aria-hidden />
				</Button>
			</div>

			<p className="mt-2 text-center text-[10px] text-muted-foreground">
				AI can make mistakes. Verify critical part numbers with the seller.
			</p>
		</div>
	);
}
