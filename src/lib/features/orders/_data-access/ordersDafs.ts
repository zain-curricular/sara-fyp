// ============================================================================
// Orders — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { OrderRow } from '@/lib/supabase/database.types'

/**
 * Loads an order by primary key (service-role; caller authorizes).
 */
export async function getOrderById(id: string): Promise<{ data: OrderRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('orders').select('*').eq('id', id).maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('orders:getOrderById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export type { OrderRow }
