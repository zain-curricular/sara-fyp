// ============================================================================
// Orders — transition_order RPC (SECURITY INVOKER + service-role webhook path)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { createUserSupabaseClient } from '@/lib/supabase/userClient'
import type { Json, OrderStatus } from '@/lib/supabase/database.types'

export type TransitionOrderRpcParsed =
	| { ok: true; new_status: OrderStatus }
	| { ok: false; error: string; from?: OrderStatus; to?: OrderStatus }

export function parseTransitionOrderRpcPayload(data: Json | null): TransitionOrderRpcParsed {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { ok: false, error: 'Invalid response' }
	}
	const o = data as Record<string, Json | undefined>
	if (o.error && typeof o.error === 'string') {
		return {
			ok: false,
			error: o.error,
			from: typeof o.from === 'string' ? (o.from as OrderStatus) : undefined,
			to: typeof o.to === 'string' ? (o.to as OrderStatus) : undefined,
		}
	}
	if (o.success === true && typeof o.new_status === 'string') {
		return { ok: true, new_status: o.new_status as OrderStatus }
	}
	return { ok: false, error: 'Invalid response' }
}

export async function transitionOrderWithUserJwt(
	accessToken: string,
	orderId: string,
	newStatus: OrderStatus,
	metadata: Record<string, unknown>,
): Promise<{ data: TransitionOrderRpcParsed | null; error: unknown }> {
	const supabase = createUserSupabaseClient(accessToken)
	const { data, error } = await supabase.rpc('transition_order', {
		p_order_id: orderId,
		p_new_status: newStatus,
		p_metadata: metadata as Json,
	})

	if (error) {
		return { data: null, error }
	}
	return { data: parseTransitionOrderRpcPayload(data), error: null }
}

/**
 * Webhook / automation — service role (no end-user JWT). DB function does not
 * enforce auth.uid(); state machine is authoritative.
 */
export async function transitionOrderWithServiceRole(
	orderId: string,
	newStatus: OrderStatus,
	metadata: Record<string, unknown>,
): Promise<{ data: TransitionOrderRpcParsed | null; error: unknown }> {
	const { data, error } = await getAdmin().rpc('transition_order', {
		p_order_id: orderId,
		p_new_status: newStatus,
		p_metadata: metadata as Json,
	})

	if (error) {
		return { data: null, error }
	}
	return { data: parseTransitionOrderRpcPayload(data), error: null }
}
