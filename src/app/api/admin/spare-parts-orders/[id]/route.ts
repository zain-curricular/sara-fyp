// ============================================================================
// PATCH /api/admin/spare-parts-orders/[id] — update spare parts order (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	adminUpdateSparePartsOrder,
	authenticateAndAuthorizeAdmin,
	patchSparePartsOrderBodySchema,
	sparePartsMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, patchSparePartsOrderBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminUpdateSparePartsOrder({
			orderId: idParse.data,
			patch: validation.data,
		})

		if (error) {
			const { status, body: errBody } = sparePartsMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/spare-parts-orders/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/spare-parts-orders/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
