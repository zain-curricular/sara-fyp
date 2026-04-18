// ============================================================================
// POST /api/ai/listings/[id]/description — AI-generated listing copy (owner)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateAndAuthorizeListing } from '@/lib/features/listings/shared/services'
import { ListingServiceError } from '@/lib/features/listings/core/services'
import { generateListingDescription, aiErrorToHttp } from '@/lib/features/ai-engine/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const auth = await authenticateAndAuthorizeListing(request, idParse.data)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await generateListingDescription({
			listing: auth.listing,
			userId: auth.user.id,
		})

		if (error instanceof ListingServiceError) {
			if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to generate description' }, { status: 500 })
		}
		if (error) {
			const http = aiErrorToHttp(error)
			return NextResponse.json(http.body, { status: http.status })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Failed to generate description' }, { status: 500 })
		}

		return NextResponse.json(
			{
				ok: true,
				data: {
					description: data.description,
					listing: data.listing,
				},
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/ai/listings/[id]/description' } })
		console.error('UNEXPECTED: POST /api/ai/listings/[id]/description', {
			error: serializeError(error),
		})
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
