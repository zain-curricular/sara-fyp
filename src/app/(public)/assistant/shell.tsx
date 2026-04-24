// ============================================================================
// Assistant Shell
// ============================================================================
//
// Client-side chat UI. Maintains message history in local state and calls
// POST /api/chatbot for each user message. Supports keyboard submission
// (Enter to send, Shift+Enter for newline).

"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/primitives/button";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Role = "user" | "assistant";

type Message = {
	id: string;
	role: Role;
	content: string;
};

// ----------------------------------------------------------------------------
// Message bubble
// ----------------------------------------------------------------------------

function MessageBubble({ message }: { message: Message }) {
	const isUser = message.role === "user";

	return (
		<div
			container-id="chat-message"
			className={cn(
				"flex gap-3",
				isUser ? "flex-row-reverse" : "flex-row",
			)}
		>
			{/* Avatar */}
			<div
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				{isUser ? (
					<User className="size-4" aria-hidden />
				) : (
					<Bot className="size-4 text-primary" aria-hidden />
				)}
			</div>

			{/* Content */}
			<div
				className={cn(
					"max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
					isUser
						? "rounded-tr-sm bg-primary text-primary-foreground"
						: "rounded-tl-sm bg-muted text-foreground",
				)}
			>
				{message.content}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Typing indicator
// ----------------------------------------------------------------------------

function TypingIndicator() {
	return (
		<div container-id="chat-typing" className="flex gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
				<Bot className="size-4 text-primary" aria-hidden />
			</div>
			<div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
				<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

const WELCOME: Message = {
	id: "welcome",
	role: "assistant",
	content:
		"Salaam! I'm ShopSmart's AI assistant. I can help you find auto parts, check compatibility, navigate orders, or answer questions about mechanic verification. How can I help you today?",
};

export default function AssistantShell() {
	const [messages, setMessages] = useState<Message[]>([WELCOME]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	async function sendMessage() {
		const text = input.trim();
		if (!text || loading) return;

		const userMsg: Message = {
			id: crypto.randomUUID(),
			role: "user",
			content: text,
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("/api/chatbot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: text, sessionId: sessionId ?? undefined }),
			});

			const json = await res.json();

			// API returns { ok, data: { response, citations, sessionId } }
			const reply: string =
				json?.data?.response ?? json?.data?.reply ?? "Sorry, something went wrong. Please try again.";

			// Persist sessionId for thread continuity
			if (json?.data?.sessionId) setSessionId(json.data.sessionId as string);

			const assistantMsg: Message = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: reply,
			};

			setMessages((prev) => [...prev, assistantMsg]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					role: "assistant",
					content: "Connection error. Please check your network and try again.",
				},
			]);
		} finally {
			setLoading(false);
			textareaRef.current?.focus();
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void sendMessage();
		}
	}

	return (
		<div container-id="assistant-page" className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col gap-0">

			{/* Header */}
			<div container-id="assistant-header" className="flex flex-col gap-1 border-b px-4 pb-4 pt-2">
				<div className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
						<Bot className="size-4 text-primary" aria-hidden />
					</div>
					<div>
						<h1 className="text-base font-semibold">ShopSmart Assistant</h1>
						<p className="text-xs text-muted-foreground">AI-powered auto parts help</p>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div
				container-id="assistant-messages"
				className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
			>
				{messages.map((msg) => (
					<MessageBubble key={msg.id} message={msg} />
				))}
				{loading && <TypingIndicator />}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div container-id="assistant-input" className="border-t px-4 py-3">
				<div className="flex gap-2">
					<Textarea
						ref={textareaRef}
						placeholder="Ask about parts, compatibility, orders…"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						rows={1}
						className="min-h-[40px] resize-none"
						disabled={loading}
					/>
					<Button
						onClick={() => void sendMessage()}
						disabled={loading || !input.trim()}
						size="icon"
						className="shrink-0"
						aria-label="Send message"
					>
						<Send className="size-4" aria-hidden />
					</Button>
				</div>
				<p className="mt-1.5 text-center text-[10px] text-muted-foreground">
					Press Enter to send · Shift+Enter for new line
				</p>
			</div>
		</div>
	);
}
