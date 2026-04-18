// ============================================================================
// Unit tests — resolveReport (RPC error mapping)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../_data-access/moderationDafs', () => ({
	listReportsForAdmin: vi.fn(),
	rpcAdminResolveReport: vi.fn(),
}))

import { rpcAdminResolveReport } from '../../_data-access/moderationDafs'
import { resolveReport } from '../../_utils/moderationOps'

const rpc = vi.mocked(rpcAdminResolveReport)

describe('resolveReport', () => {
	beforeEach(() => {
		rpc.mockReset()
	})

	it('maps REPORT_NOT_FOUND to NOT_FOUND', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'REPORT_NOT_FOUND' },
		})
		const r = await resolveReport('admin-id', 'rid', { status: 'resolved' })
		expect(r.data).toBeNull()
		expect(r.error).toBeInstanceOf(Error)
		expect((r.error as Error).message).toBe('NOT_FOUND')
	})

	it('maps ACTOR_NOT_ADMIN to FORBIDDEN', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'ACTOR_NOT_ADMIN' },
		})
		const r = await resolveReport('admin-id', 'rid', { status: 'dismissed' })
		expect((r.error as Error).message).toBe('FORBIDDEN')
	})

	it('returns data on success', async () => {
		const row = {
			id: 'rid',
			reporter_id: 'u1',
			target_type: 'listing' as const,
			target_id: 't1',
			reason: 'x',
			description: null,
			status: 'resolved' as const,
			resolved_by: 'admin-id',
			resolved_at: '2020-01-01T00:00:00.000Z',
			created_at: '2019-01-01T00:00:00.000Z',
		}
		rpc.mockResolvedValue({ data: row, error: null })
		const r = await resolveReport('admin-id', 'rid', { status: 'resolved' })
		expect(r.error).toBeNull()
		expect(r.data).toEqual(row)
	})
})
