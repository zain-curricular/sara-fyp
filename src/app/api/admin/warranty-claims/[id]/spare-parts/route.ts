// ============================================================================
// POST /api/admin/warranty-claims/[id]/spare-parts — add spare parts row (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	adminCreateSparePartsOrder,
	authenticateAndAuthorizeAdmin,
	createSparePartsOrderBodySchema,
	sparePartsMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
		const validation = validateRequestBody(body, createSparePartsOrderBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminCreateSparePartsOrder({
			claimId: idParse.data,
			partName: validation.data.part_name,
			quantity: validation.data.quantity,
			cost: validation.data.cost,
		})

		if (error) {
			const { status, body: errBody } = sparePartsMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/warranty-claims/[id]/spare-parts' } })
		console.error('UNEXPECTED: POST /api/admin/warranty-claims/[id]/spare-parts', {
			error: serializeError(error),
		})
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
