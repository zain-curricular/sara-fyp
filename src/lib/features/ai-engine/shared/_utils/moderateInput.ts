// ============================================================================
// AI Engine — OpenAI moderation pre-check for user-submitted text
// ============================================================================

import { AI_MODERATION_TIMEOUT_MS } from '../config'
import { AiError } from '../_errors/aiErrors'
import { withAbortTimeout } from './withTimeout'

type ModerationResponse = {
	results?: Array<{ flagged?: boolean }>
}

/**
 * Throws `AiError` `MODERATION_BLOCKED` when OpenAI moderation flags the input.
 * Uses a bounded timeout so callers cannot hang indefinitely.
 */
export async function moderateInput(text: string): Promise<void> {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		throw new AiError('MODEL_UNAVAILABLE', 'OPENAI_API_KEY missing for moderation')
	}

	const trimmed = text.trim()
	if (trimmed.length === 0) {
		return
	}

	const res = await withAbortTimeout(AI_MODERATION_TIMEOUT_MS, (signal) =>
		fetch('https://api.openai.com/v1/moderations', {
			method: 'POST',
			signal,
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ model: 'omni-moderation-latest', input: trimmed }),
		}),
	)

	if (!res.ok) {
		throw new AiError('UNKNOWN', `moderation HTTP ${res.status}`)
	}

	let json: ModerationResponse
	try {
		json = (await res.json()) as ModerationResponse
	} catch {
		throw new AiError('UNKNOWN', 'moderation response was not valid JSON')
	}

	const flagged = json.results?.[0]?.flagged === true
	if (flagged) {
		throw new AiError('MODERATION_BLOCKED')
	}
}
