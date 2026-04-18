// ============================================================================
// Device testing — map service errors to HTTP (thin API routes)
// ============================================================================

export function createTestReportErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'FORBIDDEN') {
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		}
		if (msg === 'INVALID_ORDER_STATE') {
			return { status: 409, body: { ok: false, error: 'Order is not in a testable state' } }
		}
		if (msg === 'DUPLICATE') {
			return { status: 409, body: { ok: false, error: 'Report already exists for this order' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Failed to create report' } }
}

export function patchTestReportErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string; details?: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'FORBIDDEN') {
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		}
		if (msg === 'ALREADY_SUBMITTED') {
			return { status: 409, body: { ok: false, error: 'Report already submitted' } }
		}
		if (msg.startsWith('VALIDATION:')) {
			return {
				status: 400,
				body: { ok: false, error: 'Validation failed', details: msg.replace(/^VALIDATION:/, '') },
			}
		}
	}
	return { status: 500, body: { ok: false, error: 'Failed to update report' } }
}

export function submitTestReportErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string; details?: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'FORBIDDEN') {
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		}
		if (msg === 'ALREADY_SUBMITTED') {
			return { status: 409, body: { ok: false, error: 'Report already submitted' } }
		}
		if (msg === 'INVALID_ORDER_STATE') {
			return { status: 409, body: { ok: false, error: 'Order must be under testing to submit' } }
		}
		if (msg === 'INSPECTION_SCHEMA_NOT_CONFIGURED') {
			return {
				status: 400,
				body: {
					ok: false,
					error: 'Category inspection schema is not configured; admin must set inspection_schema',
				},
			}
		}
		if (msg.startsWith('VALIDATION:')) {
			return {
				status: 400,
				body: { ok: false, error: 'Validation failed', details: msg.replace(/^VALIDATION:/, '') },
			}
		}
		if (msg === 'TRANSITION_FAILED' || msg === 'REPORT_PERSIST_FAILED') {
			return { status: 500, body: { ok: false, error: 'Failed to submit report' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Failed to submit report' } }
}

export function assignTesterErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'INVALID_TESTER') {
			return { status: 400, body: { ok: false, error: 'Invalid tester' } }
		}
		if (msg === 'INVALID_ORDER_STATE') {
			return {
				status: 409,
				body: { ok: false, error: 'Order is not in a state that allows tester assignment' },
			}
		}
	}
	return { status: 500, body: { ok: false, error: 'Failed to assign tester' } }
}

export function addPhotoErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'FORBIDDEN') {
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		}
		if (msg === 'ALREADY_SUBMITTED') {
			return { status: 409, body: { ok: false, error: 'Report already submitted' } }
		}
		if (msg === 'INVALID_MIME') {
			return { status: 400, body: { ok: false, error: 'Unsupported image type' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Upload failed' } }
}
