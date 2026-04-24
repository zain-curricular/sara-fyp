// ============================================================================
// Mechanic — Client Barrel
// ============================================================================
//
// Client-safe exports for the mechanic feature. Only types and schemas —
// never server-only code. Services are accessed via API routes.

export type {
	MechanicProfile,
	MechanicVerificationRequest,
	VerificationVerdict,
	VerificationStatus,
} from "./types";
