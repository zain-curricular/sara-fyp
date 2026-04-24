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
