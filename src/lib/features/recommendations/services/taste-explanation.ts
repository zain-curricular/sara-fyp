// ============================================================================
// Recommendations Feature — Taste Explanation Service
// ============================================================================
//
// Turns a taste profile into one short, human sentence ("Looks like you need
// Toyota Corolla brake parts under Rs 2k"). Runs on a slow trigger only — an
// intent shift (new top vehicle / budget) or every 3rd view — so the LLM never
// sits on the per-click hot path.
//
// Model choice
// ------------
//   ANTHROPIC_API_KEY set → Claude Haiku (fastest, cheapest Claude tier)
//   else OPENAI_API_KEY   → gpt-4o-mini (the provider ShopSmart already uses)
//   else                  → deterministic rules sentence
// RECS_EXPLANATION_MODEL overrides the model id for whichever provider runs.
//
// Reliability
// -----------
// - 4s timeout; any failure (no key, network, quota) returns the rules
//   sentence, so the demo never shows an error.
// - In-memory cache keyed by the profile's ranking inputs: identical profiles
//   from many visitors cost one model call.

import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";

import { CONDITION_LABELS, EXPLANATION_MODEL_ANTHROPIC, EXPLANATION_MODEL_OPENAI } from "../config";
import { formatPriceShort } from "../profile";
import type { TasteExplanation, TasteProfile } from "../types";

const TIMEOUT_MS = 4_000;
const CACHE_MAX = 200;
const MAX_CHARS = 160;

const cache = new Map<string, TasteExplanation>();

// -- Helpers ----------------------------------------------------------------------

function percent(share: number) {
	return `${Math.round(share * 100)}%`;
}

function describeBudget(profile: TasteProfile): string | null {
	const { min, max, target, source } = profile.budget;
	if (source === "filter") {
		if (min !== null && max !== null) return `between ${formatPriceShort(min)} and ${formatPriceShort(max)}`;
		if (max !== null) return `under ${formatPriceShort(max)}`;
		if (min !== null) return `over ${formatPriceShort(min)}`;
	}
	return target !== null ? `around ${formatPriceShort(target)}` : null;
}

/** Deterministic sentence — fallback when no model is available. */
export function buildRulesExplanation(profile: TasteProfile): string {
	const vehicle = profile.vehicles[0];
	const part = profile.partTypes[0];
	const budget = describeBudget(profile);

	const forVehicle = vehicle && vehicle.share >= 0.4 ? ` for your ${vehicle.key}` : "";
	const what = part && part.share >= 0.4 ? part.key.toLowerCase() : "parts";
	const budgetPart = budget ? ` ${budget}` : "";
	return `Looks like you're after ${what}${forVehicle}${budgetPart} — showing the closest matches.`;
}

/** Compact profile summary fed to the model (no PII, no ids). */
function buildPrompt(profile: TasteProfile): string {
	const conditions = profile.conditions
		.map((c) => `${CONDITION_LABELS[c.key] ?? c.key} ${percent(c.share)}`)
		.join(", ");
	const lines = [
		`Vehicle interest: ${profile.vehicles.map((v) => `${v.key} ${percent(v.share)}`).join(", ") || "none yet"}`,
		`Part types: ${profile.partTypes.map((p) => `${p.key} ${percent(p.share)}`).join(", ") || "none yet"}`,
		`Budget: ${describeBudget(profile) ?? "unknown"} (${profile.budget.source === "filter" ? "set by a filter" : "inferred from viewed prices"})`,
		`Condition preference: ${conditions || "none"}`,
		`Parts viewed recently: ${profile.viewedIds.length}`,
		`Latest action: ${profile.lastEventLabel ?? "none"}`,
	];
	return lines.join("\n");
}

function cacheKey(profile: TasteProfile): string {
	return JSON.stringify({
		v: profile.vehicles,
		p: profile.partTypes,
		c: profile.conditions,
		b: profile.budget,
		l: profile.lastEventLabel,
	});
}

function remember(key: string, value: TasteExplanation) {
	if (cache.size >= CACHE_MAX) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, value);
}

/** Picks the explanation model from the configured provider keys. */
function resolveModel(): { model: LanguageModel; modelId: string } | null {
	const override = process.env.RECS_EXPLANATION_MODEL?.trim();

	const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
	if (anthropicKey) {
		const modelId = override || EXPLANATION_MODEL_ANTHROPIC;
		return { model: createAnthropic({ apiKey: anthropicKey })(modelId), modelId };
	}

	const openaiKey = process.env.OPENAI_API_KEY?.trim();
	if (openaiKey) {
		const modelId = override || EXPLANATION_MODEL_OPENAI;
		return { model: createOpenAI({ apiKey: openaiKey })(modelId), modelId };
	}

	return null;
}

// -- Service ----------------------------------------------------------------------

/**
 * One-sentence read of the shopper's intent. Never fails: falls back to a
 * rules-based sentence when no model can answer in time.
 */
export async function explainTaste(profile: TasteProfile): Promise<{ data: TasteExplanation; error: null }> {
	const key = cacheKey(profile);
	const cached = cache.get(key);
	if (cached) return { data: cached, error: null };

	const fallback: TasteExplanation = { text: buildRulesExplanation(profile), source: "rules", model: null };
	const resolved = resolveModel();
	if (!resolved) return { data: fallback, error: null };

	try {
		const { text } = await generateText({
			model: resolved.model,
			system:
				"You are the shopping-intent narrator for ShopSmart, a Pakistani car spare-parts marketplace. " +
				"Given a shopper's live browsing profile, write ONE sentence (max 20 words) in second person " +
				"describing what they seem to need and that the feed now reflects it. Use 'Rs 2k' style prices. " +
				"Plain text only: no quotes, no emojis, no markdown. Mention only vehicles, part types, budget and " +
				"condition from the profile — never name specific listings, sellers or prices that are not in it.",
			prompt: buildPrompt(profile),
			maxOutputTokens: 80,
			temperature: 0.4,
			abortSignal: AbortSignal.timeout(TIMEOUT_MS),
		});

		const sentence = text.trim().replace(/^["']|["']$/g, "").slice(0, MAX_CHARS);
		if (!sentence) return { data: fallback, error: null };

		const result: TasteExplanation = { text: sentence, source: "ai", model: resolved.modelId };
		remember(key, result);
		return { data: result, error: null };
	} catch (error) {
		console.warn("[recommendations:explainTaste] model failed — using rules fallback", {
			modelId: resolved.modelId,
			error: error instanceof Error ? error.message : String(error),
		});
		return { data: fallback, error: null };
	}
}
