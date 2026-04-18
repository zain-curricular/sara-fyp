// ============================================================================
// Warranty — data access (admin / service-role client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, Json, WarrantyClaimRow, WarrantyRow } from '@/lib/supabase/database.types'

const warrantyCols =
	'id, order_id, listing_id, buyer_id, seller_id, starts_at, expires_at, status, created_at, updated_at' as const

const claimCols =
	'id, warranty_id, claimant_id, issue_description, photos, status, assigned_repair_center_id, resolution_notes, created_at, updated_at' as const

const spareCols = 'id, claim_id, part_name, quantity, cost, status, created_at, updated_at' as const

const repairCols =
	'id, name, address, city, phone_number, email, capabilities, is_active, created_at, updated_at' as const

/** Paginated list shape per `_CONVENTIONS/architecture/data-access`. */
export type PaginatedWarranties = {
	data: WarrantyRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export type PaginatedWarrantyClaims = {
	data: WarrantyClaimRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export async function getWarrantyById(
	id: string,
): Promise<{ data: WarrantyRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('warranties')
		.select(warrantyCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:getWarrantyById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listWarrantiesForProfile(
	profileId: string,
	limit: number,
	offset: number,
): Promise<PaginatedWarranties> {
	const to = offset + limit - 1
	const { data: rows, error, count } = await getAdmin()
		.from('warranties')
		.select(warrantyCols, { count: 'exact' })
		.or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
		.order('created_at', { ascending: false })
		.range(offset, to)

	if (error) {
		logDatabaseError('warranty:listWarrantiesForProfile', { profileId, limit, offset }, error)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}

export async function updateWarrantyById(
	id: string,
	patch: Database['public']['Tables']['warranties']['Update'],
): Promise<{ data: WarrantyRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('warranties')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(warrantyCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:updateWarrantyById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function getWarrantyClaimById(
	id: string,
): Promise<{ data: WarrantyClaimRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('warranty_claims')
		.select(claimCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:getWarrantyClaimById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Single transaction: insert claim + set warranty to `claimed` (see migration).
 */
export async function rpcCreateWarrantyClaimAtomic(
	warrantyId: string,
	claimantId: string,
	issueDescription: string,
): Promise<{ data: string | null; error: unknown }> {
	const { data, error } = await getAdmin().rpc('create_warranty_claim_atomic', {
		p_warranty_id: warrantyId,
		p_claimant_id: claimantId,
		p_issue_description: issueDescription,
	})

	if (error) {
		logDatabaseError('warranty:rpcCreateWarrantyClaimAtomic', { warrantyId, claimantId }, error)
	}
	return { data: data ?? null, error }
}

export async function insertWarrantyClaim(
	row: Database['public']['Tables']['warranty_claims']['Insert'] &
		Pick<WarrantyClaimRow, 'warranty_id' | 'claimant_id' | 'issue_description'>,
): Promise<{ data: WarrantyClaimRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('warranty_claims')
		.insert({
			...row,
			photos: (row.photos ?? []) as Json,
		})
		.select(claimCols)
		.maybeSingle()

	if (error) {
		logDatabaseError('warranty:insertWarrantyClaim', { warranty_id: row.warranty_id }, error)
	}
	return { data, error }
}

export async function updateWarrantyClaimById(
	id: string,
	patch: Database['public']['Tables']['warranty_claims']['Update'],
): Promise<{ data: WarrantyClaimRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('warranty_claims')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(claimCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:updateWarrantyClaimById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listWarrantyClaimsAdmin(input: {
	limit: number
	offset: number
	status?: WarrantyClaimRow['status']
}): Promise<PaginatedWarrantyClaims> {
	const to = input.offset + input.limit - 1
	let q = getAdmin()
		.from('warranty_claims')
		.select(claimCols, { count: 'exact' })
		.order('created_at', { ascending: false })

	if (input.status) {
		q = q.eq('status', input.status)
	}

	const { data: rows, error, count } = await q.range(input.offset, to)

	if (error) {
		logDatabaseError('warranty:listWarrantyClaimsAdmin', input, error)
		return {
			data: null,
			pagination: {
				total: 0,
				limit: input.limit,
				offset: input.offset,
				hasMore: false,
			},
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit: input.limit,
			offset: input.offset,
			hasMore: total > input.offset + input.limit,
		},
		error: null,
	}
}

export async function getRepairCenterById(
	id: string,
): Promise<{ data: Database['public']['Tables']['repair_centers']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('repair_centers')
		.select(repairCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:getRepairCenterById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listRepairCentersPublic(): Promise<{
	data: Database['public']['Tables']['repair_centers']['Row'][] | null
	error: unknown
}> {
	const { data, error } = await getAdmin()
		.from('repair_centers')
		.select(repairCols)
		.eq('is_active', true)
		.order('name', { ascending: true })

	if (error) {
		logDatabaseError('warranty:listRepairCentersPublic', {}, error)
	}
	return { data, error }
}

export async function insertRepairCenter(
	row: Database['public']['Tables']['repair_centers']['Insert'] &
		Pick<Database['public']['Tables']['repair_centers']['Row'], 'name' | 'address' | 'city'>,
): Promise<{ data: Database['public']['Tables']['repair_centers']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin().from('repair_centers').insert(row).select(repairCols).maybeSingle()

	if (error) {
		logDatabaseError('warranty:insertRepairCenter', { name: row.name }, error)
	}
	return { data, error }
}

export async function updateRepairCenterById(
	id: string,
	patch: Database['public']['Tables']['repair_centers']['Update'],
): Promise<{ data: Database['public']['Tables']['repair_centers']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('repair_centers')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(repairCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:updateRepairCenterById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listSparePartsForClaim(
	claimId: string,
): Promise<{ data: Database['public']['Tables']['spare_parts_orders']['Row'][] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('spare_parts_orders')
		.select(spareCols)
		.eq('claim_id', claimId)
		.order('created_at', { ascending: true })

	if (error) {
		logDatabaseError('warranty:listSparePartsForClaim', { claimId }, error)
	}
	return { data, error }
}

export async function insertSparePartsOrder(
	row: Database['public']['Tables']['spare_parts_orders']['Insert'] &
		Pick<Database['public']['Tables']['spare_parts_orders']['Row'], 'claim_id' | 'part_name'>,
): Promise<{ data: Database['public']['Tables']['spare_parts_orders']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin().from('spare_parts_orders').insert(row).select(spareCols).maybeSingle()

	if (error) {
		logDatabaseError('warranty:insertSparePartsOrder', { claim_id: row.claim_id }, error)
	}
	return { data, error }
}

export async function getSparePartsOrderById(
	id: string,
): Promise<{ data: Database['public']['Tables']['spare_parts_orders']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('spare_parts_orders')
		.select(spareCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:getSparePartsOrderById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function updateSparePartsOrderById(
	id: string,
	patch: Database['public']['Tables']['spare_parts_orders']['Update'],
): Promise<{ data: Database['public']['Tables']['spare_parts_orders']['Row'] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('spare_parts_orders')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(spareCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('warranty:updateSparePartsOrderById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}
