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

import { tokenize, rankByTokens } from "./keywords";
import type { ChatMessage, ContextListing, KbDoc } from "./types";

export { buildOfflineReply } from "./offline-responder";
export type { OfflineReply } from "./offline-responder";
export type { ContextListing, KbDoc } from "./types";

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
			.from("chatbot_sessions")
			.select("id")
			.eq("id", existingSessionId)
			.maybeSingle();

		if (data) return { data: { sessionId: data.id as string }, error: null };
	}

	// Create a new session
	const { data, error } = await admin
		.from("chatbot_sessions")
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
		.from("chatbot_sessions")
		.select("messages")
		.eq("id", sessionId)
		.maybeSingle();

	const current = (session?.messages as ChatMessage[]) ?? [];
	const updated = [...current, message];

	const { error } = await admin
		.from("chatbot_sessions")
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

/** Rows pulled from the keyword path before local relevance ranking. */
const KEYWORD_CANDIDATES = 10;

/** Documents/listings handed to the responder after ranking. */
const CONTEXT_LIMIT = 3;

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

	// Fallback: keyword search.
	//
	// Tokens are stopword-stripped and alphanumeric-only (see `tokenize`), which
	// makes them safe to interpolate into the filters built below.
	const tokens = tokenize(query, 5);

	if (tokens.length === 0) return { kbDocs: [], listings: [] };

	// Match if ANY token appears, and search titles as well as bodies: the
	// shipping article says "delivery" only in its title, so a content-only
	// filter never surfaced it for "how long does delivery take".
	const kbFilter = tokens
		.flatMap((t) => [`title.ilike.%${t}%`, `content.ilike.%${t}%`])
		.join(",");

	// Match a listing whose title contains ANY token, not just the first one
	const titleFilter = tokens.map((t) => `title.ilike.%${t}%`).join(",");

	// Over-fetch, then rank locally. Postgres returns keyword matches unordered,
	// so a bare `.limit(3)` keeps an arbitrary three — which is how "how long
	// does delivery take" surfaced the escrow article over the shipping one.
	const [kbResult, listingsResult] = await Promise.all([
		supabase
			.from("kb_documents")
			.select("id, title, content")
			.or(kbFilter)
			.limit(KEYWORD_CANDIDATES),
		supabase
			.from("listings")
			.select("id, title, price, city, condition")
			.eq("status", "active")
			.or(titleFilter)
			.limit(KEYWORD_CANDIDATES),
	]);

	const rankedKb = rankByTokens(mapKbDocs(kbResult.data ?? []), tokens);
	const rankedListings = rankByTokens(mapListings(listingsResult.data ?? []), tokens);

	return {
		kbDocs: rankedKb.slice(0, CONTEXT_LIMIT),
		listings: rankedListings.slice(0, CONTEXT_LIMIT),
	};
}

// ----------------------------------------------------------------------------
// Mappers
// ----------------------------------------------------------------------------

function mapKbDocs(rows: unknown[]): KbDoc[] {
	return (rows as Record<string, unknown>[]).map((r) => ({
		id: r.id as string,
		title: r.title as string,
		content: ((r.content as string) ?? "").slice(0, 500),
		// kb_documents has no slug column; retained as null for the KbDoc shape
		// (citations use id/title/source — wired in P3.2).
		slug: (r.slug as string | null) ?? null,
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
