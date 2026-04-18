// ============================================================================
// Warranty claims — admin status transitions
// ============================================================================

import type { ClaimStatus } from '@/lib/supabase/database.types'

const ALLOWED: Record<ClaimStatus, readonly ClaimStatus[]> = {
	submitted: ['under_review', 'rejected'],
	under_review: ['approved', 'rejected'],
	approved: ['in_repair'],
	in_repair: ['resolved'],
	rejected: [],
	resolved: [],
}

export function isValidAdminTransition(from: ClaimStatus, to: ClaimStatus): boolean {
	if (from === to) {
		return true
	}
	return ALLOWED[from]?.includes(to) ?? false
}

export function isTerminalStatus(status: ClaimStatus): boolean {
	return status === 'rejected' || status === 'resolved'
}
