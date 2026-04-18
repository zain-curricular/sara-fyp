// ============================================================================
// PATCH /api/admin/moderation/reports/[id] — resolve / update status (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateAndAuthorizeAdmin } from '@/lib/auth/adminRole'
import {
	adminResolveReportBodySchema,
	resolveReport,
} from '@/lib/features/admin-panel/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
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
		const validation = validateRequestBody(body, adminResolveReportBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await resolveReport(auth.user.id, idParse.data, validation.data)
		if (error instanceof Error && error.message === 'NOT_FOUND') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to update report' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/moderation/reports/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/moderation/reports/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
