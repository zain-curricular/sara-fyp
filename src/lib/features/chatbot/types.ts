// ============================================================================
// Chatbot — Types
// ============================================================================
//
// Domain types for the AI chatbot feature. ChatMessage mirrors the OpenAI
// message format so it can be passed directly to LangChain. Citations link
// assistant responses to source listings or knowledge-base articles.

export type Citation = {
	type: "listing" | "kb";
	id: string;
	title: string;
	url: string;
};

export type ChatMessage = {
	role: "user" | "assistant";
	content: string;
	citations?: Citation[];
};

export type ChatSession = {
	id: string;
	messages: ChatMessage[];
	lastMessageAt: string;
};

// ----------------------------------------------------------------------------
// Retrieval (RAG) shapes
// ----------------------------------------------------------------------------

/** A knowledge-base article returned by context retrieval. Content is truncated. */
export type KbDoc = {
	id: string;
	title: string;
	content: string;
	slug: string | null;
};

/** An active listing returned by context retrieval, trimmed to display fields. */
export type ContextListing = {
	id: string;
	title: string;
	price: number;
	city: string;
	condition: string;
};
