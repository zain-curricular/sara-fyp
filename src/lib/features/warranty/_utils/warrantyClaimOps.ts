// ============================================================================
// Warranty — create claim, photos, admin updates
// ============================================================================

import 'server-only'

import * as Sentry from '@sentry/nextjs'

import type { Json, SparePartStatus, WarrantyClaimRow } from '@/lib/supabase/database.types'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { serializeError } from '@/lib/utils/serializeError'

import {
	getRepairCenterById,
	getWarrantyById,
	getWarrantyClaimById,
	getSparePartsOrderById,
	insertRepairCenter,
	insertSparePartsOrder,
	rpcCreateWarrantyClaimAtomic,
	updateRepairCenterById,
	updateSparePartsOrderById,
	updateWarrantyClaimById,
} from '../_data-access/warrantyDafs'
import { isTerminalStatus, isValidAdminTransition } from './claimTransitions'

const MAX_CLAIM_PHOTOS = 5

const MIME_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf',
}

function pathsFromPhotosJson(photos: Json): string[] {
	if (!Array.isArray(photos)) {
		return []
	}
	return photos.filter((p): p is string => typeof p === 'string')
}

function rpcMessage(error: unknown): string {
	if (error && typeof error === 'object' && 'message' in error) {
		return String((error as { message: string }).message)
	}
	return ''
}

export async function createWarrantyClaim(input: {
	buyerId: string
	warrantyId: string
	issueDescription: string
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: warranty, error: wErr } = await getWarrantyById(input.warrantyId)
	if (wErr || !warranty) {
		return { data: null, error: wErr ?? new Error('NOT_FOUND') }
	}
	if (warranty.buyer_id !== input.buyerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	const { data: claimId, error: rpcErr } = await rpcCreateWarrantyClaimAtomic(
		input.warrantyId,
		input.buyerId,
		input.issueDescription,
	)

	if (rpcErr || !claimId) {
		const msg = rpcMessage(rpcErr)
		if (msg.includes('WARRANTY_NOT_FOUND')) {
			return { data: null, error: new Error('NOT_FOUND') }
		}
		if (msg.includes('WARRANTY_NOT_CLAIMABLE')) {
			return { data: null, error: new Error('WARRANTY_NOT_CLAIMABLE') }
		}
		console.error('warranty:createWarrantyClaim rpc failed', {
			warrantyId: input.warrantyId,
			error: serializeError(rpcErr),
		})
		Sentry.captureException(rpcErr instanceof Error ? rpcErr : new Error('create_warranty_claim_atomic failed'), {
			extra: { warrantyId: input.warrantyId, buyerId: input.buyerId, message: msg },
		})
		return { data: null, error: rpcErr ?? new Error('INSERT_FAILED') }
	}

	return { data: { id: claimId }, error: null }
}

export async function addPhotoToWarrantyClaim(input: {
	claimId: string
	userId: string
	bytes: Uint8Array
	contentType: string
}): Promise<{ data: { path: string; signed_url: string | null } | null; error: unknown }> {
	const { data: claim, error: cErr } = await getWarrantyClaimById(input.claimId)
	if (cErr || !claim) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}
	if (claim.claimant_id !== input.userId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (isTerminalStatus(claim.status)) {
		return { data: null, error: new Error('TERMINAL_CLAIM') }
	}

	const paths = pathsFromPhotosJson(claim.photos)
	if (paths.length >= MAX_CLAIM_PHOTOS) {
		return { data: null, error: new Error('PHOTO_LIMIT') }
	}

	const ext = MIME_EXT[input.contentType]
	if (!ext) {
		return { data: null, error: new Error('INVALID_MIME') }
	}

	const objectPath = `${input.claimId}/${crypto.randomUUID()}.${ext}`
	const bucket = getAdmin().storage.from('warranty-docs')

	const { error: upErr } = await bucket.upload(objectPath, input.bytes, {
		contentType: input.contentType,
		upsert: false,
	})
	if (upErr) {
		console.error('warranty:addPhoto storage upload failed', {
			claimId: input.claimId,
			error: serializeError(upErr),
		})
		Sentry.captureException(upErr instanceof Error ? upErr : new Error('warranty photo upload failed'), {
			extra: { claimId: input.claimId, step: 'storage_upload' },
		})
		return { data: null, error: upErr }
	}

	const { data: signed, error: signErr } = await bucket.createSignedUrl(objectPath, 3600)
	if (signErr) {
		await bucket.remove([objectPath])
		console.error('warranty:addPhoto signed URL failed', {
			claimId: input.claimId,
			error: serializeError(signErr),
		})
		Sentry.captureException(signErr instanceof Error ? signErr : new Error('warranty photo signed url failed'), {
			extra: { claimId: input.claimId, step: 'signed_url' },
		})
		return { data: null, error: signErr }
	}

	const nextPhotos = [...paths, objectPath] as unknown as Json
	const { error: uErr } = await updateWarrantyClaimById(input.claimId, { photos: nextPhotos })
	if (uErr) {
		await bucket.remove([objectPath])
		console.error('warranty:addPhoto persist photos failed', {
			claimId: input.claimId,
			error: serializeError(uErr),
		})
		Sentry.captureException(uErr instanceof Error ? uErr : new Error('warranty photo db update failed'), {
			extra: { claimId: input.claimId, step: 'persist_photos' },
		})
		return { data: null, error: uErr }
	}

	return { data: { path: objectPath, signed_url: signed?.signedUrl ?? null }, error: null }
}

export async function adminUpdateWarrantyClaim(input: {
	claimId: string
	patch: {
		status?: WarrantyClaimRow['status']
		assigned_repair_center_id?: string | null
		resolution_notes?: string | null
	}
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: claim, error: cErr } = await getWarrantyClaimById(input.claimId)
	if (cErr || !claim) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}

	if (isTerminalStatus(claim.status)) {
		return { data: null, error: new Error('TERMINAL_CLAIM') }
	}

	const resolvedStatus = input.patch.status ?? claim.status

	if (input.patch.status !== undefined && input.patch.status !== claim.status) {
		if (!isValidAdminTransition(claim.status, input.patch.status)) {
			return { data: null, error: new Error('INVALID_TRANSITION') }
		}
	}

	const assignedAfter =
		input.patch.assigned_repair_center_id !== undefined
			? input.patch.assigned_repair_center_id
			: claim.assigned_repair_center_id

	if (resolvedStatus === 'in_repair' && !assignedAfter) {
		return { data: null, error: new Error('REPAIR_CENTER_REQUIRED') }
	}

	if (assignedAfter) {
		const { data: center, error: rcErr } = await getRepairCenterById(assignedAfter)
		if (rcErr || !center || !center.is_active) {
			return { data: null, error: new Error('INVALID_REPAIR_CENTER') }
		}
	}

	const { data: updated, error: uErr } = await updateWarrantyClaimById(input.claimId, {
		...(input.patch.status !== undefined ? { status: input.patch.status } : {}),
		...(input.patch.assigned_repair_center_id !== undefined
			? { assigned_repair_center_id: input.patch.assigned_repair_center_id }
			: {}),
		...(input.patch.resolution_notes !== undefined ? { resolution_notes: input.patch.resolution_notes } : {}),
	})
	if (uErr || !updated) {
		console.error('warranty:adminUpdateWarrantyClaim failed', {
			claimId: input.claimId,
			error: serializeError(uErr),
		})
		Sentry.captureException(uErr instanceof Error ? uErr : new Error('adminUpdateWarrantyClaim failed'), {
			extra: { claimId: input.claimId },
		})
		return { data: null, error: uErr ?? new Error('UPDATE_FAILED') }
	}

	return { data: { id: updated.id }, error: null }
}

export async function adminCreateSparePartsOrder(input: {
	claimId: string
	partName: string
	quantity: number
	cost: number | null | undefined
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: claim, error: cErr } = await getWarrantyClaimById(input.claimId)
	if (cErr || !claim) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}
	if (claim.status !== 'in_repair') {
		return { data: null, error: new Error('SPARE_PARTS_WRONG_STATE') }
	}

	const { data: row, error: iErr } = await insertSparePartsOrder({
		claim_id: input.claimId,
		part_name: input.partName,
		quantity: input.quantity,
		cost: input.cost ?? null,
	})
	if (iErr || !row) {
		console.error('warranty:adminCreateSparePartsOrder insert failed', {
			claimId: input.claimId,
			error: serializeError(iErr),
		})
		Sentry.captureException(iErr instanceof Error ? iErr : new Error('insert spare parts failed'), {
			extra: { claimId: input.claimId },
		})
		return { data: null, error: iErr ?? new Error('INSERT_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}

export async function adminUpdateSparePartsOrder(input: {
	orderId: string
	patch: {
		part_name?: string
		quantity?: number
		cost?: number | null
		status?: SparePartStatus
	}
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: existing, error: eErr } = await getSparePartsOrderById(input.orderId)
	if (eErr || !existing) {
		return { data: null, error: eErr ?? new Error('NOT_FOUND') }
	}

	const { data: row, error: uErr } = await updateSparePartsOrderById(input.orderId, {
		...(input.patch.part_name !== undefined ? { part_name: input.patch.part_name } : {}),
		...(input.patch.quantity !== undefined ? { quantity: input.patch.quantity } : {}),
		...(input.patch.cost !== undefined ? { cost: input.patch.cost } : {}),
		...(input.patch.status !== undefined ? { status: input.patch.status } : {}),
	})
	if (uErr || !row) {
		console.error('warranty:adminUpdateSparePartsOrder failed', {
			orderId: input.orderId,
			error: serializeError(uErr),
		})
		Sentry.captureException(uErr instanceof Error ? uErr : new Error('update spare parts failed'), {
			extra: { orderId: input.orderId },
		})
		return { data: null, error: uErr ?? new Error('UPDATE_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}

export async function adminCreateRepairCenter(input: {
	name: string
	address: string
	city: string
	phone_number?: string | null
	email?: string | null
	capabilities?: unknown[]
	is_active?: boolean
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: row, error } = await insertRepairCenter({
		name: input.name,
		address: input.address,
		city: input.city,
		phone_number: input.phone_number ?? null,
		email: input.email ?? null,
		capabilities: (input.capabilities ?? []) as unknown as Json,
		is_active: input.is_active ?? true,
	})
	if (error || !row) {
		console.error('warranty:adminCreateRepairCenter failed', { error: serializeError(error) })
		Sentry.captureException(error instanceof Error ? error : new Error('insert repair center failed'))
		return { data: null, error: error ?? new Error('INSERT_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}

export async function adminUpdateRepairCenter(input: {
	id: string
	patch: Partial<{
		name: string
		address: string
		city: string
		phone_number: string | null
		email: string | null
		capabilities: Json
		is_active: boolean
	}>
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: existing, error: eErr } = await getRepairCenterById(input.id)
	if (eErr || !existing) {
		return { data: null, error: eErr ?? new Error('NOT_FOUND') }
	}

	const { data: row, error: uErr } = await updateRepairCenterById(input.id, input.patch)
	if (uErr || !row) {
		console.error('warranty:adminUpdateRepairCenter failed', {
			id: input.id,
			error: serializeError(uErr),
		})
		Sentry.captureException(uErr instanceof Error ? uErr : new Error('update repair center failed'), {
			extra: { repairCenterId: input.id },
		})
		return { data: null, error: uErr ?? new Error('UPDATE_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}
