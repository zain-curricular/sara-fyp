// ============================================================================
// Chatbot — Services
// ============================================================================
//
// Server-only services for the AI chatbot feature. Handles session management
// (stored in Supabase), message persistence, and context retrieval via
// vector similarity search against listings and kb_documents.
//
// Vector search
// -------------
// `retrieveContext` embeds the user query via the AI provider, then runs
// cosine similarity search against the `listings` and `kb_documents` tables
// using pgvector's `<=>` operator. Falls back to keyword search if no
// embedding model is available.

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ai/provider";

import type { ChatMessage } from "./types";

// ----------------------------------------------------------------------------
// Session management
// ----------------------------------------------------------------------------

/**
 * Retrieves an existing chat session or creates a new one.
 * Anonymous users pass userId=null; a session is created without a user link.
 */
export async function createOrGetSession(
	userId: string | null,
	existingSessionId?: string,
): Promise<{ data: { sessionId: string }; error: unknown }> {
	const admin = createAdminSupabaseClient();

	// Try to find an existing session
	if (existingSessionId) {
		const { data } = await admin
			.from("chat_sessions")
			.select("id")
			.eq("id", existingSessionId)
			.maybeSingle();

		if (data) return { data: { sessionId: data.id as string }, error: null };
	}

	// Create a new session
	const { data, error } = await admin
		.from("chat_sessions")
		.insert({
			user_id: userId,
			messages: [],
			last_message_at: new Date().toISOString(),
		})
		.select("id")
		.single();

	if (error) return { data: { sessionId: "" }, error };

	return { data: { sessionId: data.id as string }, error: null };
}

// ----------------------------------------------------------------------------
// Message persistence
// ----------------------------------------------------------------------------

/**
 * Appends a message to an existing chat session.
 * Reads the current messages array, appends, and writes back.
 */
export async function appendMessage(
	sessionId: string,
	message: ChatMessage,
): Promise<{ error: unknown }> {
	const admin = createAdminSupabaseClient();

	// Read current messages
	const { data: session } = await admin
		.from("chat_sessions")
		.select("messages")
		.eq("id", sessionId)
		.maybeSingle();

	const current = (session?.messages as ChatMessage[]) ?? [];
	const updated = [...current, message];

	const { error } = await admin
		.from("chat_sessions")
		.update({
			messages: updated,
			last_message_at: new Date().toISOString(),
		})
		.eq("id", sessionId);

	return { error: error ?? null };
}

// ----------------------------------------------------------------------------
// Context retrieval (RAG)
// ----------------------------------------------------------------------------

/**
 * Retrieves relevant context for a user query using vector similarity search.
 * Returns top-3 KB documents and top-3 active listings by embedding cosine distance.
 * Falls back to text search if no embedding model is available.
 */
export async function retrieveContext(query: string): Promise<{
	kbDocs: KbDoc[];
	listings: ContextListing[];
}> {
	const supabase = await createServerSupabaseClient();
	const embedding = await embedText(query);

	if (embedding) {
		// Vector similarity search
		const [kbResult, listingsResult] = await Promise.all([
			supabase.rpc("search_kb_documents", {
				query_embedding: embedding,
				match_count: 3,
			}),
			supabase.rpc("search_listings_by_embedding", {
				query_embedding: embedding,
				match_count: 3,
			}),
		]);

		const kbDocs = mapKbDocs(kbResult.data ?? []);
		const listings = mapListings(listingsResult.data ?? []);

		if (kbDocs.length > 0 || listings.length > 0) {
			return { kbDocs, listings };
		}
	}

	// Fallback: text search
	const queryWords = query
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 5);

	const searchTerm = queryWords.join(" | ");

	const [kbResult, listingsResult] = await Promise.all([
		supabase
			.from("kb_documents")
			.select("id, title, content, slug")
			.textSearch("content", searchTerm, { type: "websearch" })
			.limit(3),
		supabase
			.from("listings")
			.select("id, title, price, city, condition")
			.eq("status", "active")
			.ilike("title", `%${queryWords[0] ?? query}%`)
			.limit(3),
	]);

	return {
		kbDocs: mapKbDocs(kbResult.data ?? []),
		listings: mapListings(listingsResult.data ?? []),
	};
}

// ----------------------------------------------------------------------------
// Internal types + mappers
// ----------------------------------------------------------------------------

export type KbDoc = {
	id: string;
	title: string;
	content: string;
	slug: string | null;
};

export type ContextListing = {
	id: string;
	title: string;
	price: number;
	city: string;
	condition: string;
};

function mapKbDocs(rows: unknown[]): KbDoc[] {
	return (rows as Record<string, unknown>[]).map((r) => ({
		id: r.id as string,
		title: r.title as string,
		content: ((r.content as string) ?? "").slice(0, 500),
		slug: r.slug as string | null,
	}));
}

function mapListings(rows: unknown[]): ContextListing[] {
	return (rows as Record<string, unknown>[]).map((r) => ({
		id: r.id as string,
		title: r.title as string,
		price: r.price as number,
		city: r.city as string,
		condition: r.condition as string,
	}));
}
