// ============================================================================
// Warranty — Zod request schemas
// ============================================================================

import { z } from 'zod'

import type { ClaimStatus } from '@/lib/supabase/database.types'

const claimStatusSchema = z.enum([
	'submitted',
	'under_review',
	'approved',
	'rejected',
	'in_repair',
	'resolved',
]) satisfies z.ZodType<ClaimStatus>

export const warrantiesMeQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const createWarrantyClaimBodySchema = z.object({
	warranty_id: z.string().uuid(),
	issue_description: z.string().trim().min(1).max(8000),
})

export const adminPatchWarrantyClaimBodySchema = z
	.object({
		status: claimStatusSchema.optional(),
		assigned_repair_center_id: z.string().uuid().nullable().optional(),
		resolution_notes: z.string().trim().max(8000).nullable().optional(),
	})
	.refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' })

export const listWarrantyClaimsAdminQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional().default(50),
	offset: z.coerce.number().int().min(0).optional().default(0),
	status: claimStatusSchema.optional(),
})

export const createRepairCenterBodySchema = z.object({
	name: z.string().trim().min(1).max(200),
	address: z.string().trim().min(1).max(500),
	city: z.string().trim().min(1).max(120),
	phone_number: z.string().trim().max(40).nullable().optional(),
	email: z.string().email().max(200).nullable().optional(),
	capabilities: z.array(z.string()).optional().default([]),
	is_active: z.boolean().optional().default(true),
})

export const patchRepairCenterBodySchema = createRepairCenterBodySchema
	.partial()
	.refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' })

export const createSparePartsOrderBodySchema = z.object({
	part_name: z.string().trim().min(1).max(200),
	quantity: z.coerce.number().int().min(1).max(999).optional().default(1),
	cost: z.coerce.number().min(0).nullable().optional(),
})

export const patchSparePartsOrderBodySchema = z
	.object({
		part_name: z.string().trim().min(1).max(200).optional(),
		quantity: z.coerce.number().int().min(1).max(999).optional(),
		cost: z.coerce.number().min(0).nullable().optional(),
		status: z.enum(['ordered', 'received', 'installed']).optional(),
	})
	.refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' })
