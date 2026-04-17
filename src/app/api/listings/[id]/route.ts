// ============================================================================
// GET /api/listings/[id]  — public (active) or full row for owner
// PATCH /api/listings/[id] — seller update
// DELETE /api/listings/[id] — remove draft or soft-delete
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest, getOptionalUserIdFromRequest } from '@/lib/auth/auth'
import { updateListingSchema } from '@/lib/features/listings'
import {
	getListingById,
	removeListing,
	updateOwnListing,
	ListingServiceError,
} from '@/lib/features/listings/core/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Detail view: active listings are public; owners see their own in any status.
 */
export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data: row, error } = await getListingById(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load listing' }, { status: 500 })
		}
		if (!row) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const viewerId = await getOptionalUserIdFromRequest(request)
		const isOwner = viewerId === row.user_id
		if (!isOwner && (row.deleted_at || row.status !== 'active')) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data: row }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]' } })
		console.error('UNEXPECTED: GET /api/listings/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Partial update for the listing owner.
 */
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, updateListingSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await updateOwnListing(idParse.data, auth.user.id, validation.data)
		if (error instanceof ListingServiceError) {
			if (error.code === 'DETAILS_INVALID') {
				return NextResponse.json(
					{ ok: false, error: 'Invalid details', fields: error.fields },
					{ status: 400 },
				)
			}
			if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (error.code === 'LOCKED') {
				return NextResponse.json({ ok: false, error: 'Listing cannot be edited' }, { status: 400 })
			}
			if (error.code === 'CATEGORY_MISMATCH') {
				return NextResponse.json(
					{ ok: false, error: 'Category platform mismatch' },
					{ status: 400 },
				)
			}
		}
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to update listing' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/listings/[id]' } })
		console.error('UNEXPECTED: PATCH /api/listings/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Removes draft (hard delete) or soft-deletes published listings.
 */
export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { error } = await removeListing(idParse.data, auth.user.id)
		if (error instanceof ListingServiceError) {
			if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to remove listing' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'DELETE /api/listings/[id]' } })
		console.error('UNEXPECTED: DELETE /api/listings/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
