// ============================================================================
// PATCH /api/admin/repair-centers/[id] — update repair center (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	adminUpdateRepairCenter,
	authenticateAndAuthorizeAdmin,
	patchRepairCenterBodySchema,
	repairCenterMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import type { Json } from '@/lib/supabase/database.types'
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
		const validation = validateRequestBody(body, patchRepairCenterBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const patch = validation.data
		const { data, error } = await adminUpdateRepairCenter({
			id: idParse.data,
			patch: {
				...(patch.name !== undefined ? { name: patch.name } : {}),
				...(patch.address !== undefined ? { address: patch.address } : {}),
				...(patch.city !== undefined ? { city: patch.city } : {}),
				...(patch.phone_number !== undefined ? { phone_number: patch.phone_number } : {}),
				...(patch.email !== undefined ? { email: patch.email } : {}),
				...(patch.capabilities !== undefined ? { capabilities: patch.capabilities as unknown as Json } : {}),
				...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
			},
		})

		if (error) {
			const { status, body: errBody } = repairCenterMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/repair-centers/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/repair-centers/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
