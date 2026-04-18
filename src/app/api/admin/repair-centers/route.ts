// ============================================================================
// POST /api/admin/repair-centers — create repair center (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	adminCreateRepairCenter,
	authenticateAndAuthorizeAdmin,
	createRepairCenterBodySchema,
	repairCenterMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createRepairCenterBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminCreateRepairCenter({
			name: validation.data.name,
			address: validation.data.address,
			city: validation.data.city,
			phone_number: validation.data.phone_number,
			email: validation.data.email,
			capabilities: validation.data.capabilities,
			is_active: validation.data.is_active,
		})

		if (error) {
			const { status, body: errBody } = repairCenterMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/repair-centers' } })
		console.error('UNEXPECTED: POST /api/admin/repair-centers', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
