// ============================================================================
// Escrow — subscription checkout rows (service-role; admin client)
// ============================================================================

import { subscriptionEscrowMetadataSchema } from '@/lib/features/subscriptions/schemas'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { EscrowTransactionRow, SubscriptionRow, SubscriptionTier } from '@/lib/supabase/database.types'

const escrowColumns =
	'id, order_id, type, amount, payment_method, external_tx_id, status, metadata, created_at' as const

export async function insertSubscriptionHoldEscrow(input: {
	amount: number
	userId: string
	targetTier: SubscriptionTier
	paymentMethod: EscrowTransactionRow['payment_method']
	externalTxId?: string | null
}): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const metadataParsed = subscriptionEscrowMetadataSchema.safeParse({
		kind: 'subscription' as const,
		user_id: input.userId,
		target_tier: input.targetTier,
	})
	if (!metadataParsed.success) {
		return { data: null, error: new Error('INVALID_METADATA') }
	}
	const metadata = metadataParsed.data

	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.insert({
			order_id: null,
			type: 'hold',
			amount: input.amount,
			payment_method: input.paymentMethod,
			external_tx_id: input.externalTxId ?? null,
			status: 'pending',
			metadata,
		})
		.select(escrowColumns)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError(
			'escrow:insertSubscriptionHoldEscrow',
			{ userId: input.userId, targetTier: input.targetTier },
			error,
		)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

type SubscriptionEscrowRpcPayload = {
	ok?: boolean
	error?: string
	subscription?: SubscriptionRow
	already_failed?: boolean
}

/**
 * Atomically completes escrow + inserts subscription (DB transaction via RPC).
 */
export async function completeSubscriptionEscrowAtomic(
	escrowTransactionId: string,
	externalTxId: string | null,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data, error } = await getAdmin().rpc('complete_subscription_escrow', {
		p_escrow_id: escrowTransactionId,
		p_external_tx_id: externalTxId,
	})

	if (error) {
		logDatabaseError(
			'escrow:complete_subscription_escrow',
			{ escrowTransactionId },
			error,
		)
		return { data: null, error }
	}

	const payload = data as SubscriptionEscrowRpcPayload
	if (payload?.ok === true && payload.subscription) {
		return { data: payload.subscription, error: null }
	}

	const code =
		typeof payload?.error === 'string' && payload.error.length > 0
			? payload.error
			: 'ACTIVATION_FAILED'
	return { data: null, error: new Error(code) }
}

/**
 * Fails a pending subscription escrow row (validated in SQL).
 */
export async function failSubscriptionEscrowAtomic(
	escrowTransactionId: string,
): Promise<{ error: unknown }> {
	const { data, error } = await getAdmin().rpc('fail_subscription_escrow', {
		p_escrow_id: escrowTransactionId,
	})

	if (error) {
		logDatabaseError('escrow:fail_subscription_escrow', { escrowTransactionId }, error)
		return { error }
	}

	const payload = data as SubscriptionEscrowRpcPayload
	if (payload?.ok === true) {
		return { error: null }
	}

	const code =
		typeof payload?.error === 'string' && payload.error.length > 0
			? payload.error
			: 'FAIL_FAILED'
	return { error: new Error(code) }
}

export async function getEscrowTransactionById(
	id: string,
): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.select(escrowColumns)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('escrow:getEscrowTransactionById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function updateEscrowTransaction(
	id: string,
	patch: Partial<Pick<EscrowTransactionRow, 'status' | 'external_tx_id' | 'metadata'>>,
): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.update(patch)
		.eq('id', id)
		.select(escrowColumns)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('escrow:updateEscrowTransaction', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}
