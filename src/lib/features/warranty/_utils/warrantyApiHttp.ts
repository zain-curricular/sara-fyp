// ============================================================================
// Warranty — map service errors to HTTP
// ============================================================================

export function warrantyClaimMutationErrorToHttp(error: unknown): {
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
		if (msg === 'WARRANTY_NOT_CLAIMABLE') {
			return {
				status: 409,
				body: { ok: false, error: 'Warranty is not active or has expired' },
			}
		}
		if (msg === 'INVALID_TRANSITION') {
			return { status: 409, body: { ok: false, error: 'Invalid status transition' } }
		}
		if (msg === 'REPAIR_CENTER_REQUIRED') {
			return {
				status: 400,
				body: { ok: false, error: 'Repair center is required before moving to in repair' },
			}
		}
		if (msg === 'INVALID_REPAIR_CENTER') {
			return { status: 400, body: { ok: false, error: 'Invalid repair center' } }
		}
		if (msg === 'TERMINAL_CLAIM') {
			return { status: 409, body: { ok: false, error: 'Claim is closed' } }
		}
		if (msg === 'SPARE_PARTS_WRONG_STATE') {
			return {
				status: 409,
				body: { ok: false, error: 'Spare parts can only be added while the claim is in repair' },
			}
		}
		if (msg === 'PHOTO_LIMIT') {
			return { status: 409, body: { ok: false, error: 'Maximum number of photos reached' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Request failed' } }
}

export function warrantyPhotoErrorToHttp(error: unknown): {
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
		if (msg === 'INVALID_MIME') {
			return { status: 400, body: { ok: false, error: 'Unsupported file type' } }
		}
		if (msg === 'TERMINAL_CLAIM') {
			return { status: 409, body: { ok: false, error: 'Claim is closed' } }
		}
		if (msg === 'PHOTO_LIMIT') {
			return { status: 409, body: { ok: false, error: 'Maximum number of photos reached' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Upload failed' } }
}

export function sparePartsMutationErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'SPARE_PARTS_WRONG_STATE') {
			return {
				status: 409,
				body: { ok: false, error: 'Spare parts can only be added while the claim is in repair' },
			}
		}
	}
	return { status: 500, body: { ok: false, error: 'Request failed' } }
}

export function repairCenterMutationErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error && error.message === 'NOT_FOUND') {
		return { status: 404, body: { ok: false, error: 'Not found' } }
	}
	return { status: 500, body: { ok: false, error: 'Request failed' } }
}
