// ============================================================================
// Warranty — read paths (auth enforced in service)
// ============================================================================

import 'server-only'

import { getProfileById } from '@/lib/features/profiles/services'
import type { Database, WarrantyClaimRow, WarrantyRow } from '@/lib/supabase/database.types'

import {
	type PaginatedWarranties,
	type PaginatedWarrantyClaims,
	getWarrantyById,
	getWarrantyClaimById,
	listRepairCentersPublic,
	listSparePartsForClaim,
	listWarrantiesForProfile,
	listWarrantyClaimsAdmin,
} from '../_data-access/warrantyDafs'

export type { PaginatedWarranties, PaginatedWarrantyClaims }

export async function listMyWarranties(
	userId: string,
	page: number,
	limit: number,
): Promise<PaginatedWarranties> {
	const offset = (page - 1) * limit
	return listWarrantiesForProfile(userId, limit, offset)
}

export async function getWarrantyForParticipant(
	userId: string,
	warrantyId: string,
): Promise<{ data: WarrantyRow | null; error: unknown }> {
	const { data: w, error } = await getWarrantyById(warrantyId)
	if (error || !w) {
		return { data: null, error: error ?? new Error('NOT_FOUND') }
	}
	const { data: profile } = await getProfileById(userId)
	if (!profile) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (profile.role === 'admin') {
		return { data: w, error: null }
	}
	if (w.buyer_id === userId || w.seller_id === userId) {
		return { data: w, error: null }
	}
	return { data: null, error: new Error('FORBIDDEN') }
}

export type ClaimDetailPayload = {
	claim: WarrantyClaimRow
	warranty: WarrantyRow
	spare_parts: Database['public']['Tables']['spare_parts_orders']['Row'][]
}

export async function getClaimDetailForParticipant(
	userId: string,
	claimId: string,
): Promise<{ data: ClaimDetailPayload | null; error: unknown }> {
	const { data: claim, error: cErr } = await getWarrantyClaimById(claimId)
	if (cErr || !claim) {
		return { data: null, error: cErr ?? new Error('NOT_FOUND') }
	}
	const { data: warranty, error: wErr } = await getWarrantyById(claim.warranty_id)
	if (wErr || !warranty) {
		return { data: null, error: wErr ?? new Error('NOT_FOUND') }
	}

	const { data: profile } = await getProfileById(userId)
	if (!profile) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	const isAdmin = profile.role === 'admin'
	const isClaimant = claim.claimant_id === userId
	const isSeller = warranty.seller_id === userId
	if (!isAdmin && !isClaimant && !isSeller) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	const { data: spareParts, error: sErr } = await listSparePartsForClaim(claimId)
	if (sErr) {
		return { data: null, error: sErr }
	}

	return {
		data: {
			claim,
			warranty,
			spare_parts: spareParts ?? [],
		},
		error: null,
	}
}

export async function listClaimsForAdmin(input: {
	limit: number
	offset: number
	status?: WarrantyClaimRow['status']
}): Promise<PaginatedWarrantyClaims> {
	return listWarrantyClaimsAdmin(input)
}

export async function listActiveRepairCenters(): Promise<{
	data: Database['public']['Tables']['repair_centers']['Row'][] | null
	error: unknown
}> {
	return listRepairCentersPublic()
}
