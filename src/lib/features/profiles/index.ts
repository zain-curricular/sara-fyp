// ============================================================================
// Profiles — client-safe barrel
// ============================================================================
//
// Re-exports types, Zod schemas, and config for use in client components and
// route validation. Does not export server-only DAFs or services — import from
// `./services` in Server Components and API routes only.

export type { Profile, PublicProfile } from './types'
export {
	updateOwnProfileSchema,
	adminUpdateProfileSchema,
	type UpdateOwnProfileInput,
	type AdminUpdateProfileInput,
} from './schemas'
export { AVATAR_MAX_BYTES, AVATAR_ALLOWED_MIME } from './config'
