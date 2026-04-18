// ============================================================================
// Admin Panel — audit log DAFs (append-only)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { AdminAuditLogRow, Json } from '@/lib/supabase/database.types'

export async function insertAdminAuditLog(input: {
	actorId: string
	action: string
	targetType: string
	targetId: string | null
	metadata?: Json
}): Promise<{ data: AdminAuditLogRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('admin_audit_logs')
		.insert({
			actor_id: input.actorId,
			action: input.action,
			target_type: input.targetType,
			target_id: input.targetId,
			metadata: (input.metadata ?? {}) as Json,
		})
		.select('*')
		.maybeSingle()

	if (error) {
		logDatabaseError('adminPanel:insertAdminAuditLog', { action: input.action }, error)
	}
	return { data: data as AdminAuditLogRow | null, error }
}
