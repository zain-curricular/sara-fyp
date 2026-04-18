// ============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { moderateInput } from '../../shared/_utils/moderateInput'

describe('moderateInput', () => {
	const origKey = process.env.OPENAI_API_KEY
	const origFetch = globalThis.fetch

	beforeEach(() => {
		process.env.OPENAI_API_KEY = 'test-key'
	})

	afterEach(() => {
		process.env.OPENAI_API_KEY = origKey
		globalThis.fetch = origFetch
		vi.restoreAllMocks()
	})

	it('no-ops on empty string', async () => {
		globalThis.fetch = vi.fn()
		await moderateInput('   ')
		expect(globalThis.fetch).not.toHaveBeenCalled()
	})

	it('throws MODEL_UNAVAILABLE when key missing', async () => {
		delete process.env.OPENAI_API_KEY
		await expect(moderateInput('hello')).rejects.toMatchObject({
			code: 'MODEL_UNAVAILABLE',
		})
	})

	it('throws MODERATION_BLOCKED when flagged', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ results: [{ flagged: true }] }),
		})
		await expect(moderateInput('text')).rejects.toMatchObject({ code: 'MODERATION_BLOCKED' })
		expect(globalThis.fetch).toHaveBeenCalled()
	})

	it('throws UNKNOWN on invalid JSON body', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => {
				throw new SyntaxError('bad json')
			},
		})
		await expect(moderateInput('text')).rejects.toMatchObject({ code: 'UNKNOWN' })
	})
})
