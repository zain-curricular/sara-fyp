// ============================================================================
// PATCH /api/testing/reports/[id] — update draft inspection report
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeTester,
	patchTestReportBodySchema,
	patchTestReportErrorToHttp,
	updateTestReportDraft,
} from '@/lib/features/device-testing/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeTester(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, patchTestReportBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await updateTestReportDraft({
			reportId: idParse.data,
			testerId: auth.user.id,
			...(validation.data.inspection_results !== undefined
				? { inspection_results: validation.data.inspection_results }
				: {}),
			...(validation.data.overall_score !== undefined ? { overall_score: validation.data.overall_score } : {}),
			...(validation.data.overall_notes !== undefined ? { overall_notes: validation.data.overall_notes } : {}),
		})

		if (error) {
			const { status, body } = patchTestReportErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/testing/reports/[id]' } })
		console.error('UNEXPECTED: PATCH /api/testing/reports/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
