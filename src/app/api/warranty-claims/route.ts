// ============================================================================
// POST /api/warranty-claims — buyer files a claim on an active warranty
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	createWarrantyClaim,
	createWarrantyClaimBodySchema,
	warrantyClaimMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createWarrantyClaimBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createWarrantyClaim({
			buyerId: auth.user.id,
			warrantyId: validation.data.warranty_id,
			issueDescription: validation.data.issue_description,
		})

		if (error) {
			const { status, body: errBody } = warrantyClaimMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/warranty-claims' } })
		console.error('UNEXPECTED: POST /api/warranty-claims', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
