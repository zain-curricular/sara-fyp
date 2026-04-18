// ============================================================================
// Recommendations — cold-start personalised picks (generateStructured, haiku)
// ============================================================================

import 'server-only'

import { z } from 'zod'

import { listCategoriesByPlatform } from '@/lib/features/product-catalog/services'
import type { PlatformType } from '@/lib/supabase/database.types'

import { generateStructured } from '@/lib/features/ai-engine/services'
import type { TrustedUserId } from '@/lib/features/ai-engine'

export const coldStartCategoryPickSchema = z.object({
	category_ids: z.array(z.string().uuid()).min(1).max(5),
})

/**
 * Asks the model to choose up to 5 category UUIDs from the active catalog for this platform.
 */
export async function pickColdStartCategoryIds(input: {
	platform: PlatformType
	userId: TrustedUserId
}): Promise<{ data: string[] | null; error: unknown }> {
	const { data: cats, error: cErr } = await listCategoriesByPlatform(input.platform)
	if (cErr) {
		return { data: null, error: cErr }
	}
	const active = (cats ?? []).filter((c) => c.is_active)
	if (active.length === 0) {
		return { data: null, error: new Error('NO_ACTIVE_CATEGORIES') }
	}

	const catalogLines = active
		.slice(0, 50)
		.map((c) => `${c.id} — ${c.name}`)
		.join('\n')

	const prompt = `You help a new marketplace user with no browsing history yet.
Pick 1–5 category UUIDs from the list below that are a sensible starting mix for discovery (variety is good).
Return JSON only with key category_ids (array of UUID strings from the list).

Catalog (id — name):
${catalogLines}`

	try {
		const out = await generateStructured({
			schema: coldStartCategoryPickSchema,
			prompt,
			system:
				'You output only valid JSON matching the schema. Every category_id MUST be copied exactly from the catalog lines.',
			model: 'haiku',
			feature: 'recommendations',
			userId: input.userId,
		})
		const picked = new Set(out.data.category_ids)
		const valid = active.filter((c) => picked.has(c.id)).map((c) => c.id)
		if (valid.length === 0) {
			return { data: null, error: new Error('AI_PICK_EMPTY') }
		}
		return { data: valid.slice(0, 5), error: null }
	} catch (e) {
		return { data: null, error: e }
	}
}
