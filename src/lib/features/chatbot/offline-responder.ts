// ============================================================================
// Chatbot — Offline Responder
// ============================================================================
//
// Builds a genuine answer from retrieved context when no LLM is configured
// (`OPENAI_API_KEY` absent → `getChatModel()` returns null).
//
// Why this exists
// ---------------
// The chatbot previously dead-ended on "I'm currently unavailable", discarding
// the knowledge-base articles and listings that RAG had already retrieved. The
// retrieval half of the pipeline works without any API key — only the
// generation half needs one. This module replaces generation with extraction:
// rank the retrieved documents against the question and return the best source
// material verbatim, with citations.
//
// Design
// ------
// Extractive, never generative. Every sentence returned is either fixed UI copy
// or text pulled straight from a knowledge-base article / listing row. Nothing
// is invented, so the guardrails the system prompt enforced for the LLM path
// (no invented part numbers, no delivery promises) hold structurally here.
//
// Pipeline
// --------
//   1. Guardrail — decline clearly out-of-scope questions.
//   2. Greeting — short social openers get a capability summary, not a search.
//   3. Rank     — score KB docs by token overlap (title weighted 3×).
//   4. Compose  — best article + matching listings + escalation path.
//
// Citations cover only the sources actually used in the reply.

import type { Citation, ContextListing, KbDoc } from "./types";
import { tokenize, rankByTokens } from "./keywords";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** Topics the assistant is explicitly scoped away from. */
const OUT_OF_SCOPE = /\b(medical|medicine|doctor|symptom|disease|prescription|lawyer|lawsuit|attorney|court|sue|divorce)\b/;

/** Social openers that should be answered with capabilities, not a search. */
const GREETING = /^(hi|hey|hello|salam|assalam|assalamualaikum|aoa|yo|good (morning|afternoon|evening)|thanks|thank you|thankyou|ok|okay)\b/;

/** Listings shown inline before the reply gets unwieldy. */
const MAX_LISTINGS = 3;

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

export type OfflineReply = {
	content: string;
	citations: Citation[];
};

export type OfflineReplyInput = {
	message: string;
	kbDocs: KbDoc[];
	listings: ContextListing[];
};

// ----------------------------------------------------------------------------
// Formatting helpers
// ----------------------------------------------------------------------------

/** Formats a listing price in PKR, matching the marketplace's display style. */
function formatPrice(price: number): string {
	return `Rs ${price.toLocaleString("en-PK")}`;
}

/** Renders one listing as a single bullet line. */
function formatListing(listing: ContextListing): string {
	return `• ${listing.title} — ${formatPrice(listing.price)} · ${listing.city} · ${listing.condition}`;
}

/** Builds the citation for a knowledge-base article. */
function kbCitation(doc: KbDoc): Citation {
	return {
		type: "kb",
		id: doc.id,
		title: doc.title,
		url: doc.slug ? `/help/${doc.slug}` : "/help",
	};
}

/** Builds the citation for a listing. */
function listingCitation(listing: ContextListing): Citation {
	return {
		type: "listing",
		id: listing.id,
		title: listing.title,
		url: `/listings/${listing.id}`,
	};
}

// ----------------------------------------------------------------------------
// Canned replies
// ----------------------------------------------------------------------------

/** Reply for questions outside the marketplace's remit. */
function declineOutOfScope(): OfflineReply {
	return {
		content:
			"I can only help with spare parts, vehicle compatibility, and shopping on ShopSmart — that one is outside what I cover.\n\nAsk me about finding a part, checking compatibility, orders, escrow payments, returns, or shipping.",
		citations: [],
	};
}

/** Reply for greetings and other short social openers. */
function greet(): OfflineReply {
	return {
		content:
			"Hello! I'm the ShopSmart Assistant. I can help you with:\n\n• Finding spare parts and checking prices\n• Vehicle compatibility and OEM part numbers\n• Buying, selling, and order tracking\n• Escrow payments, returns, and shipping\n\nWhat are you looking for?",
		citations: [],
	};
}

/** Reply when retrieval found nothing relevant. */
function noResults(message: string): OfflineReply {
	const trimmed = message.length > 60 ? `${message.slice(0, 60)}…` : message;

	return {
		content:
			`I couldn't find anything in our help articles or listings for "${trimmed}".\n\nTry naming the part together with the vehicle — for example "Mehran brake pads" or "Cultus fuel filter". You can also browse all parts at /parts, or open a listing and use Contact Seller to ask the seller directly.`,
		citations: [],
	};
}

// ----------------------------------------------------------------------------
// Responder
// ----------------------------------------------------------------------------

/**
 * Produces the assistant's reply from retrieved context, without an LLM.
 *
 * Guarantees: the reply never fabricates part numbers, prices, or delivery
 * promises — every factual claim is copied from `kbDocs` or `listings`.
 *
 * @param input Question plus the KB articles and listings RAG retrieved for it.
 */
export function buildOfflineReply({
	message,
	kbDocs,
	listings,
}: OfflineReplyInput): OfflineReply {
	const normalised = message.toLowerCase().trim();

	// 1. Guardrail — stay inside the marketplace domain
	if (OUT_OF_SCOPE.test(normalised)) return declineOutOfScope();

	// 2. Greeting — short social openers, not search queries
	if (GREETING.test(normalised) && normalised.split(/\s+/).length <= 4) {
		return greet();
	}

	const tokens = tokenize(message);
	const rankedDocs = rankByTokens(kbDocs, tokens);
	const topDoc = rankedDocs[0];
	const shownListings = listings.slice(0, MAX_LISTINGS);

	// 3. Nothing retrieved — say so plainly rather than inventing an answer
	if (!topDoc && shownListings.length === 0) return noResults(message);

	const sections: string[] = [];
	const citations: Citation[] = [];

	// 4a. Best-matching help article, quoted in full (articles are short)
	if (topDoc) {
		sections.push(`${topDoc.title}\n\n${topDoc.content}`);
		citations.push(kbCitation(topDoc));
	}

	// 4b. Matching listings, with the escalation path the guardrails require
	if (shownListings.length > 0) {
		const heading =
			shownListings.length === 1
				? "Here's a matching listing on ShopSmart:"
				: `Here are ${shownListings.length} matching listings on ShopSmart:`;

		sections.push(`${heading}\n${shownListings.map(formatListing).join("\n")}`);
		sections.push(
			"Open a listing for photos, seller rating, and compatible vehicles — or use Contact Seller if you need to confirm fitment.",
		);
		citations.push(...shownListings.map(listingCitation));
	}

	// 4c. Point at related articles the reply didn't quote
	const relatedDocs = rankedDocs.slice(1, 3);
	if (relatedDocs.length > 0) {
		sections.push(
			`Related help articles: ${relatedDocs.map((d) => d.title).join(", ")}.`,
		);
		citations.push(...relatedDocs.map(kbCitation));
	}

	return { content: sections.join("\n\n"), citations };
}
