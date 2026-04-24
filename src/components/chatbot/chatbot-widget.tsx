// ============================================================================
// Chatbot Widget
// ============================================================================
//
// Floating chat button fixed at bottom-right. On click opens a 400×500
// chat panel. Same chatbot API integration as the full /chatbot page.
// Session ID stored in localStorage. Minimizes on Escape or click outside.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, Minimize2, Send, X } from "lucide-react";

import type { Citation } from "@/lib/features/chatbot";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const SESSION_KEY = "shopsmart_chat_session_id";

type WidgetMessage = {
	role: "user" | "assistant";
	content: string;
	citations?: Citation[];
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ChatbotWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<WidgetMessage[]>([
		{
			role: "assistant",
			content: "Hi! Need help finding a part? Ask me anything.",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [unread, setUnread] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	// Restore session
	useEffect(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(SESSION_KEY);
			if (stored) setSessionId(stored);
		}
	}, []);

	// Auto scroll
	useEffect(() => {
		if (open) {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			setUnread(false);
		}
	}, [messages, open]);

	// Click outside to close
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				open &&
				panelRef.current &&
				!panelRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	// Escape to close
	useEffect(() => {
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape" && open) setOpen(false);
		}
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [open]);

	async function sendMessage() {
		const trimmed = input.trim();
		if (!trimmed || loading) return;

		setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("/api/chatbot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: trimmed,
					sessionId: sessionId ?? undefined,
				}),
			});
			const json = await res.json();

			if (json.ok && json.data) {
				const { response, citations, sessionId: newId } = json.data;
				if (newId && newId !== sessionId) {
					setSessionId(newId);
					if (typeof window !== "undefined") {
						localStorage.setItem(SESSION_KEY, newId);
					}
				}
				setMessages((prev) => [
					...prev,
					{ role: "assistant", content: response, citations: citations ?? [] },
				]);
				if (!open) setUnread(true);
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: "Connection error. Please try again." },
			]);
		} finally {
			setLoading(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault();
			sendMessage();
		}
	}

	return (
		<div container-id="chatbot-widget" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

			{/* Chat panel */}
			{open && (
				<div
					ref={panelRef}
					container-id="chatbot-panel"
					className="flex w-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:w-[400px]"
					style={{ height: "500px" }}
					role="dialog"
					aria-label="ShopSmart AI chat"
				>
					{/* Panel header */}
					<div className="flex items-center justify-between border-b bg-background px-4 py-3">
						<div className="flex items-center gap-2">
							<div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
								<Bot className="size-3.5 text-primary" aria-hidden />
							</div>
							<span className="text-sm font-semibold">ShopSmart Assistant</span>
						</div>
						<div className="flex items-center gap-1">
							<Link href="/chatbot" title="Open full chat">
								<Button variant="ghost" size="icon" className="size-7">
									<ExternalLink className="size-3.5" aria-hidden />
								</Button>
							</Link>
							<Button
								variant="ghost"
								size="icon"
								className="size-7"
								onClick={() => setOpen(false)}
								aria-label="Close chat"
							>
								<Minimize2 className="size-3.5" aria-hidden />
							</Button>
						</div>
					</div>

					{/* Messages */}
					<div
						container-id="chatbot-widget-messages"
						className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
						aria-live="polite"
					>
						{messages.map((msg, i) => (
							<div
								key={i}
								className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
										msg.role === "user"
											? "rounded-tr-none bg-primary text-primary-foreground"
											: "rounded-tl-none bg-muted"
									}`}
								>
									{msg.content}
								</div>
								{msg.citations && msg.citations.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{msg.citations.slice(0, 3).map((c) => (
											<Link key={c.id} href={c.url}>
												<Badge
													variant="secondary"
													className="cursor-pointer rounded-sm text-[10px]"
												>
													{c.title}
												</Badge>
											</Link>
										))}
									</div>
								)}
							</div>
						))}
						{loading && (
							<div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-muted px-3 py-2 w-fit">
								<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
								<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
								<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
							</div>
						)}
						<div ref={bottomRef} />
					</div>

					{/* Input */}
					<div className="flex items-center gap-2 border-t px-3 py-2">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask a question…"
							disabled={loading}
							className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
						/>
						<Button
							size="icon"
							className="size-7 shrink-0"
							onClick={sendMessage}
							disabled={loading || !input.trim()}
							aria-label="Send"
						>
							<Send className="size-3.5" aria-hidden />
						</Button>
					</div>
				</div>
			)}

			{/* Floating button */}
			<button
				onClick={() => { setOpen((v) => !v); setUnread(false); }}
				className="relative flex size-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
				aria-label={open ? "Close AI chat" : "Open AI chat"}
			>
				{open ? (
					<X className="size-6 text-primary-foreground" aria-hidden />
				) : (
					<Bot className="size-6 text-primary-foreground" aria-hidden />
				)}
				{unread && !open && (
					<span className="absolute right-0 top-0 size-3 rounded-full bg-red-500 ring-2 ring-background" />
				)}
			</button>
		</div>
	);
}
