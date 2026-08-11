// ============================================================================
// Chatbot — Keyword Utilities
// ============================================================================
//
// Shared text helpers for the keyword retrieval path and the offline responder.
// Both need the same notion of a "meaningful" token, so the stopword list and
// tokeniser live here instead of being duplicated across the two modules.
//
// Tokenisation
// ------------
// Lowercase → strip non-alphanumerics → split on whitespace → drop stopwords
// and single characters. The output feeds two consumers:
//
//   1. `services.ts` — builds Postgres `to_tsquery` / `ilike` filters from it,
//      so tokens are guaranteed alphanumeric and safe to interpolate.
//   2. `offline-responder.ts` — scores knowledge-base documents by overlap.
//
// Without stopword removal a question like "how do i buy a part" retrieves on
// "how"/"do"/"i", which matches nothing useful.

// ----------------------------------------------------------------------------
// Stopwords
// ----------------------------------------------------------------------------

/**
 * Common English function words plus chat filler that carries no retrieval
 * signal. Deliberately excludes domain words ("part", "buy", "ship") — those
 * are exactly what we want to match on.
 */
const STOPWORDS = new Set([
	"a", "about", "an", "and", "any", "are", "as", "at", "be", "been", "but",
	"by", "can", "could", "did", "do", "does", "for", "from", "get", "got",
	"had", "has", "have", "he", "her", "hey", "hi", "him", "his", "how", "i",
	"if", "in", "is", "it", "its", "just", "know", "like", "me", "my", "need",
	"of", "on", "or", "our", "please", "she", "should", "so", "some", "tell",
	"than", "that", "the", "their", "them", "then", "there", "these", "they",
	"this", "to", "up", "us", "was", "we", "were", "what", "when", "where",
	"which", "who", "why", "will", "with", "would", "you", "your",
]);

// ----------------------------------------------------------------------------
// Tokeniser
// ----------------------------------------------------------------------------

/**
 * Suffixes stripped to reduce a word to a matchable stem, longest first so
 * "inspection" loses "ion" rather than "on".
 */
const SUFFIXES = ["ations", "ation", "ments", "ment", "ings", "ing", "ions", "ion", "ies", "es", "ed", "s"];

/** A stem shorter than this is too ambiguous to search on. */
const MIN_STEM = 4;

/**
 * Strips one plural/tense suffix so related word forms match each other.
 *
 * Deliberately crude — it only needs to bridge the gap between how users
 * phrase questions and how articles are titled ("inspected" → "inspect", which
 * matches "Mechanic Inspection Service"). Suffixes that would leave too short a
 * stem are skipped, so "payments" yields "payment" rather than "pay".
 */
export function stem(word: string): string {
	for (const suffix of SUFFIXES) {
		if (!word.endsWith(suffix)) continue;

		const stripped = word.slice(0, -suffix.length);
		if (stripped.length >= MIN_STEM) return stripped;
	}

	return word;
}

/**
 * Reduces free text to meaningful, stemmed, alphanumeric search tokens.
 *
 * Tokens are alphanumeric by construction, so callers may interpolate them
 * into SQL filters without further escaping.
 *
 * @param text  Raw user message.
 * @param limit Maximum tokens to return (keeps generated SQL bounded).
 * @returns De-duplicated stems, longest-first so the most specific term leads.
 */
export function tokenize(text: string, limit = 8): string[] {
	const words = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 1 && !STOPWORDS.has(w))
		.map(stem);

	// De-duplicate ("part"/"parts" collapse), then prefer longer, more specific terms
	const unique = [...new Set(words)];
	unique.sort((a, b) => b.length - a.length);

	return unique.slice(0, limit);
}

// ----------------------------------------------------------------------------
// Relevance ranking
// ----------------------------------------------------------------------------

/** A title match is worth this many content matches when scoring. */
const TITLE_WEIGHT = 3;

/** Anything with a title and (optionally) a body that can be ranked. */
type Rankable = { title: string; content?: string };

/**
 * Scores one record by how many query tokens it contains.
 *
 * Title hits weigh heaviest — an article named "Return and Refund Policy" is
 * the right answer to "how do I return a part" even if the body barely repeats
 * the word. Substring matching absorbs simple plurals ("return" ⊂ "returns").
 */
function scoreByTokens(item: Rankable, tokens: string[]): number {
	const title = item.title.toLowerCase();
	const content = (item.content ?? "").toLowerCase();

	return tokens.reduce((score, token) => {
		const inTitle = title.includes(token) ? TITLE_WEIGHT : 0;
		const inContent = content.includes(token) ? 1 : 0;
		return score + inTitle + inContent;
	}, 0);
}

/**
 * Orders records by token overlap, dropping those with no overlap at all.
 *
 * Postgres returns keyword matches unordered, so a bare `.limit(3)` keeps an
 * arbitrary three of them. Retrieval therefore over-fetches for recall and
 * defers to this function for precision.
 *
 * @param items  Candidate records from retrieval.
 * @param tokens Query tokens from {@link tokenize}.
 */
export function rankByTokens<T extends Rankable>(items: T[], tokens: string[]): T[] {
	return items
		.map((item) => ({ item, score: scoreByTokens(item, tokens) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score)
		.map((entry) => entry.item);
}
