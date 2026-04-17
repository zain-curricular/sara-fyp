// ============================================================================
// Validation primitives
// ============================================================================

import { z } from 'zod'

/** Zod schema for a UUID string (v4-style ids from Postgres gen_random_uuid). */
export const uuidValidation = z.string().uuid()
