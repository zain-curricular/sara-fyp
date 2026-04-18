// ============================================================================
// Unit tests — claim transition rules
// ============================================================================

import { describe, it, expect } from 'vitest'

import { isValidAdminTransition, isTerminalStatus } from '../../_utils/claimTransitions'

describe('isValidAdminTransition', () => {
	it('allows submitted -> under_review and rejected', () => {
		expect(isValidAdminTransition('submitted', 'under_review')).toBe(true)
		expect(isValidAdminTransition('submitted', 'rejected')).toBe(true)
	})
	it('allows under_review -> approved | rejected', () => {
		expect(isValidAdminTransition('under_review', 'approved')).toBe(true)
		expect(isValidAdminTransition('under_review', 'rejected')).toBe(true)
	})
	it('allows approved -> in_repair and in_repair -> resolved', () => {
		expect(isValidAdminTransition('approved', 'in_repair')).toBe(true)
		expect(isValidAdminTransition('in_repair', 'resolved')).toBe(true)
	})
	it('rejects invalid jumps', () => {
		expect(isValidAdminTransition('submitted', 'resolved')).toBe(false)
		expect(isValidAdminTransition('approved', 'resolved')).toBe(false)
	})
	it('treats same status as valid', () => {
		expect(isValidAdminTransition('under_review', 'under_review')).toBe(true)
	})
})

describe('isTerminalStatus', () => {
	it('identifies closed claims', () => {
		expect(isTerminalStatus('rejected')).toBe(true)
		expect(isTerminalStatus('resolved')).toBe(true)
		expect(isTerminalStatus('submitted')).toBe(false)
	})
})
