// ============================================================================
// AI Provider Abstraction
// ============================================================================
//
// Thin wrapper so the provider (OpenAI today, Llama/Groq tomorrow) can be
// swapped via env vars without touching call sites.
//
// If OPENAI_API_KEY is missing the factory returns null — callers must
// check for null and return a graceful fallback, never crash.

import "server-only";

let _chat: unknown = null;
let _embeddings: unknown = null;
let _initialized = false;

function init() {
	if (_initialized) return;
	_initialized = true;

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) return;

	try {
		// Dynamic require so the module doesn't crash at import time when key is absent
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { ChatOpenAI } = require("@langchain/openai");
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { OpenAIEmbeddings } = require("@langchain/openai");

		_chat = new ChatOpenAI({
			apiKey,
			modelName: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
			temperature: 0.3,
		});

		_embeddings = new OpenAIEmbeddings({
			apiKey,
			modelName: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
		});
	} catch {
		// LangChain not installed or misconfigured — degrade gracefully
	}
}

/** Returns the chat model or null if provider unavailable. */
export function getChatModel(): unknown {
	init();
	return _chat;
}

/** Returns the embeddings model or null if provider unavailable. */
export function getEmbeddingsModel(): unknown {
	init();
	return _embeddings;
}

/** Embed a single text string. Returns null if provider unavailable. */
export async function embedText(text: string): Promise<number[] | null> {
	init();
	if (!_embeddings) return null;
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await (_embeddings as any).embedQuery(text);
		return result as number[];
	} catch {
		return null;
	}
}
