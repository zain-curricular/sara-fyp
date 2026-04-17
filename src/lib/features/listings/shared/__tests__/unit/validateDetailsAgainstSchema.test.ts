// ============================================================================
// Unit tests — validateDetailsAgainstSchema
// ============================================================================

import { describe, it, expect } from 'vitest'

import { validateDetailsAgainstSchema } from '@/lib/features/listings/shared/services'

describe('validateDetailsAgainstSchema', () => {
	it('accepts valid details matching spec', () => {
		const r = validateDetailsAgainstSchema(
			{ ram_gb: 'number', color: 'string' },
			{ ram_gb: 8, color: 'Black' },
		)
		expect(r.ok).toBe(true)
		if (r.ok) {
			expect(r.data.ram_gb).toBe(8)
		}
	})

	it('rejects extra keys (strict)', () => {
		const r = validateDetailsAgainstSchema({ a: 'string' }, { a: 'x', b: 1 })
		expect(r.ok).toBe(false)
	})

	it('rejects wrong types', () => {
		const r = validateDetailsAgainstSchema({ x: 'number' }, { x: 'not-a-number' })
		expect(r.ok).toBe(false)
	})
})
