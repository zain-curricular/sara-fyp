// ============================================================================
// POST /api/ai/generate-listing
// ============================================================================
//
// AI-powered listing description generator.
// Uses LangChain + OpenAI via getChatModel(). Degrades gracefully when the
// model is unavailable (no API key or LangChain not installed).
//
// Request body:
//   { title, categoryName, specs: Record<string,string>, imageUrls: string[], vehicleTargets: string[] }
//
// Success response:
//   { ok: true, data: { suggestedTitle, description, specs, conditionHint, suggestedCompatibleVehicles } }
//
// Fallback (no AI):
//   { ok: true, data: { suggestedTitle, description, specs, conditionHint } }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { getChatModel } from "@/lib/ai/provider";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const bodySchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	categoryName: z.string().min(1, "Category name is required"),
	specs: z.record(z.string(), z.string()).optional().default({}),
	imageUrls: z.array(z.string().url()).optional().default([]),
	vehicleTargets: z.array(z.string()).optional().default([]),
});

// ----------------------------------------------------------------------------
// Placeholder fallback
// ----------------------------------------------------------------------------

function buildPlaceholder(title: string) {
	return {
		suggestedTitle: title,
		description:
			"Quality spare part for your vehicle. This part has been inspected and is ready for installation. " +
			"Please verify compatibility with your specific make, model, and year before purchasing. " +
			"Contact us with your vehicle details for fitment confirmation.",
		specs: {},
		conditionHint: "Describe the condition accurately — mention any wear, damage, or missing components.",
	};
}

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { title, categoryName, specs, vehicleTargets } = parsed.data;

	// Graceful degradation when AI is unavailable
	const model = getChatModel();
	if (!model) {
		return NextResponse.json({ ok: true, data: buildPlaceholder(title) });
	}

	try {
		// Build prompt
		const specsText =
			Object.keys(specs).length > 0
				? Object.entries(specs)
						.map(([k, v]) => `- ${k}: ${v}`)
						.join("\n")
				: "No specs provided";

		const vehiclesText =
			vehicleTargets.length > 0
				? vehicleTargets.join(", ")
				: "Not specified";

		const systemPrompt = `You are an expert automotive parts copywriter for a Pakistani marketplace.
Write genuine, accurate descriptions. Use clear language Pakistani buyers understand.
Rules:
- NEVER invent OEM part numbers or specifications not provided.
- Include clear compatibility caveats — always recommend buyer verifies fitment.
- Use "genuine part" language only if the seller explicitly confirms it.
- Highlight condition, fitment, and value clearly.
- Keep descriptions concise (3–5 sentences).
- Do NOT use markdown — plain text only.`;

		const userPrompt = `Generate a listing for this automotive spare part:

Title: ${title}
Category: ${categoryName}
Specs:
${specsText}
Compatible vehicles (if known): ${vehiclesText}

Return a JSON object with these exact fields:
{
  "suggestedTitle": "improved title (max 80 chars)",
  "description": "3-5 sentence part description",
  "specs": { "key": "value" },
  "conditionHint": "advice on how to describe condition for this part type",
  "suggestedCompatibleVehicles": ["vehicle 1", "vehicle 2"]
}`;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const m = model as any;
		const response = await m.invoke([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		]);

		const content =
			typeof response?.content === "string"
				? response.content
				: JSON.stringify(response?.content ?? "");

		// Extract JSON from the response
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return NextResponse.json({ ok: true, data: buildPlaceholder(title) });
		}

		const aiData = JSON.parse(jsonMatch[0]) as {
			suggestedTitle?: string;
			description?: string;
			specs?: Record<string, string>;
			conditionHint?: string;
			suggestedCompatibleVehicles?: string[];
		};

		return NextResponse.json({
			ok: true,
			data: {
				suggestedTitle: aiData.suggestedTitle ?? title,
				description: aiData.description ?? buildPlaceholder(title).description,
				specs: aiData.specs ?? {},
				conditionHint: aiData.conditionHint ?? buildPlaceholder(title).conditionHint,
				suggestedCompatibleVehicles: aiData.suggestedCompatibleVehicles ?? [],
			},
		});
	} catch (e) {
		console.error("[POST /api/ai/generate-listing] AI error:", e);
		// Degrade gracefully on AI error
		return NextResponse.json({ ok: true, data: buildPlaceholder(title) });
	}
}
