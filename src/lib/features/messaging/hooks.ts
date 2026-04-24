// ============================================================================
// Messaging — Client Hooks
// ============================================================================
//
// React hooks that call the messaging API routes. All hooks use a simple
// useState/useEffect pattern consistent with the rest of the codebase (no
// React Query dependency). Mutations return promises so callers can await them.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { Conversation, Message } from "@/lib/features/messaging/types";
import type { SendMessageInput, StartConversationInput } from "@/lib/features/messaging/schemas";

// ----------------------------------------------------------------------------
// useConversations
// ----------------------------------------------------------------------------

/** Fetches the authenticated user's conversation list from GET /api/conversations. */
export function useConversations(initial?: Conversation[]) {
	const authFetch = useAuthenticatedFetch();

	const [conversations, setConversations] = useState<Conversation[]>(initial ?? []);
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
					| { ok: true; data: { conversations: Conversation[] } }
					| { ok: false; error: string }
				>("/api/conversations");
				if (cancelled) return;
				if (result.ok) {
					setConversations(result.data.conversations);
				} else {
					setError(result.error);
				}
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load conversations");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [nonce, initial, authFetch]);

	return useMemo(
		() => ({ conversations, isLoading, error, refetch, setConversations }),
		[conversations, isLoading, error, refetch],
	);
}

// ----------------------------------------------------------------------------
// useMessages
// ----------------------------------------------------------------------------

/** Fetches messages for a conversation from GET /api/conversations/[id]/messages. */
export function useMessages(conversationId: string | null, initial?: Message[]) {
	const authFetch = useAuthenticatedFetch();

	const [messages, setMessages] = useState<Message[]>(initial ?? []);
	const [isLoading, setIsLoading] = useState(Boolean(conversationId) && initial === undefined);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);

	const refetch = useCallback(() => setNonce((v) => v + 1), []);

	useEffect(() => {
		if (!conversationId) return;
		if (initial !== undefined && nonce === 0) return;

		let cancelled = false;
		void (async () => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await authFetch<
					| { ok: true; data: { messages: Message[] } }
					| { ok: false; error: string }
				>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`);
				if (cancelled) return;
				if (result.ok) {
					setMessages(result.data.messages);
				} else {
					setError(result.error);
				}
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load messages");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [conversationId, nonce, initial, authFetch]);

	const appendMessage = useCallback((msg: Message) => {
		setMessages((prev) => {
			const exists = prev.some((m) => m.id === msg.id);
			return exists ? prev : [...prev, msg];
		});
	}, []);

	return useMemo(
		() => ({ messages, isLoading, error, refetch, appendMessage, setMessages }),
		[messages, isLoading, error, refetch, appendMessage],
	);
}

// ----------------------------------------------------------------------------
// useSendMessage
// ----------------------------------------------------------------------------

/** Returns a mutation function that POSTs a message to a conversation. */
export function useSendMessage(conversationId: string) {
	const authFetch = useAuthenticatedFetch();
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const send = useCallback(
		async (input: SendMessageInput): Promise<Message | null> => {
			setIsSending(true);
			setError(null);
			try {
				const result = await authFetch<
					| { ok: true; data: Message }
					| { ok: false; error: string }
				>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				if (result.ok) return result.data;
				setError(result.error);
				return null;
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to send message");
				return null;
			} finally {
				setIsSending(false);
			}
		},
		[conversationId, authFetch],
	);

	return useMemo(() => ({ send, isSending, error }), [send, isSending, error]);
}

// ----------------------------------------------------------------------------
// useStartConversation
// ----------------------------------------------------------------------------

/** Returns a mutation that POSTs to /api/conversations to get-or-create a conversation. */
export function useStartConversation() {
	const authFetch = useAuthenticatedFetch();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const start = useCallback(
		async (input: StartConversationInput): Promise<{ conversationId: string } | null> => {
			setIsPending(true);
			setError(null);
			try {
				const result = await authFetch<
					| { ok: true; data: { conversationId: string } }
					| { ok: false; error: string }
				>("/api/conversations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				});
				if (result.ok) return result.data;
				setError(result.error);
				return null;
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to start conversation");
				return null;
			} finally {
				setIsPending(false);
			}
		},
		[authFetch],
	);

	return useMemo(() => ({ start, isPending, error }), [start, isPending, error]);
}

// ----------------------------------------------------------------------------
// useMarkConversationRead
// ----------------------------------------------------------------------------

/** Posts to /api/conversations/[id]/read to mark a conversation as read. */
export function useMarkConversationRead() {
	const authFetch = useAuthenticatedFetch();

	return useCallback(
		async (conversationId: string) => {
			try {
				await authFetch(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
					method: "POST",
				});
			} catch {
				// Non-critical — silently fail
			}
		},
		[authFetch],
	);
}

// ----------------------------------------------------------------------------
// useRealtimeMessages
// ----------------------------------------------------------------------------

/**
 * Subscribes to Supabase Realtime INSERT events on the messages table filtered
 * by conversation_id. Calls onMessage for each new row. Cleans up on unmount.
 */
export function useRealtimeMessages(
	conversationId: string | null,
	onMessage: (msg: Message) => void,
) {
	useEffect(() => {
		if (!conversationId) return;

		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`messages:${conversationId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `conversation_id=eq.${conversationId}`,
				},
				(payload) => {
					const row = payload.new as {
						id: string;
						conversation_id: string;
						sender_id: string;
						body: string;
						attachments: string[];
						read_at: string | null;
						created_at: string;
					};
					onMessage({
						id: row.id,
						conversationId: row.conversation_id,
						senderId: row.sender_id,
						body: row.body,
						attachments: row.attachments ?? [],
						readAt: row.read_at ?? null,
						createdAt: row.created_at,
					});
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [conversationId, onMessage]);
}


