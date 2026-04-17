// ============================================================================
// Profiles — domain types
// ============================================================================
//
// Aliases Row types from database.types and defines PublicProfile (API-facing
// shape with moderation/PII fields stripped by the service layer).

import type { Database } from '@/lib/supabase/database.types'

/**
 * Full profile row as stored in Postgres (includes email, phone, ban flag).
 */
export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Profile returned by public read APIs — excludes sensitive fields.
 */
export type PublicProfile = Omit<Profile, 'email' | 'phone_number' | 'is_banned'>
