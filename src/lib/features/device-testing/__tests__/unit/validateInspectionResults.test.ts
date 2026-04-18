// ============================================================================
// Unit tests — validateInspectionResultsAgainstSchema
// ============================================================================

import { describe, it, expect } from 'vitest'

import { validateInspectionResultsAgainstSchema } from '@/lib/features/device-testing/_utils/validateInspectionResults'

describe('validateInspectionResultsAgainstSchema', () => {
	it('accepts valid nested criteria', () => {
		const schema = {
			battery: { score: 'number', notes: 'string' },
		}
		const results = {
			battery: { score: 8, notes: 'ok' },
		}
		const r = validateInspectionResultsAgainstSchema(schema, results)
		expect(r.ok).toBe(true)
	})

	it('rejects missing criterion', () => {
		const schema = {
			battery: { score: 'number', notes: 'string' },
		}
		const r = validateInspectionResultsAgainstSchema(schema, {})
		expect(r.ok).toBe(false)
	})

	it('rejects extra top-level keys', () => {
		const schema = {
			battery: { score: 'number', notes: 'string' },
		}
		const r = validateInspectionResultsAgainstSchema(schema, {
			battery: { score: 1, notes: 'x' },
			extra: {},
		})
		expect(r.ok).toBe(false)
	})
})
