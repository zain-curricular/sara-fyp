// ============================================================================
// Unit tests — deviceTestingApiHttp mappers
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	addPhotoErrorToHttp,
	assignTesterErrorToHttp,
	createTestReportErrorToHttp,
	patchTestReportErrorToHttp,
	submitTestReportErrorToHttp,
} from '@/lib/features/device-testing/_utils/deviceTestingApiHttp'

describe('createTestReportErrorToHttp', () => {
	it('maps known errors', () => {
		expect(createTestReportErrorToHttp(new Error('NOT_FOUND')).status).toBe(404)
		expect(createTestReportErrorToHttp(new Error('DUPLICATE')).status).toBe(409)
	})
})

describe('submitTestReportErrorToHttp', () => {
	it('maps INSPECTION_SCHEMA_NOT_CONFIGURED', () => {
		const r = submitTestReportErrorToHttp(new Error('INSPECTION_SCHEMA_NOT_CONFIGURED'))
		expect(r.status).toBe(400)
		expect(r.body.error).toContain('inspection schema')
	})
	it('maps REPORT_PERSIST_FAILED', () => {
		expect(submitTestReportErrorToHttp(new Error('REPORT_PERSIST_FAILED')).status).toBe(500)
	})
})

describe('assignTesterErrorToHttp', () => {
	it('maps INVALID_ORDER_STATE', () => {
		expect(assignTesterErrorToHttp(new Error('INVALID_ORDER_STATE')).status).toBe(409)
	})
})

describe('patchTestReportErrorToHttp', () => {
	it('maps validation prefix', () => {
		const r = patchTestReportErrorToHttp(new Error('VALIDATION:x'))
		expect(r.status).toBe(400)
		if ('details' in r.body) {
			expect(r.body.details).toBe('x')
		}
	})
})

describe('addPhotoErrorToHttp', () => {
	it('maps INVALID_MIME', () => {
		expect(addPhotoErrorToHttp(new Error('INVALID_MIME')).status).toBe(400)
	})
})
