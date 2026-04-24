// ============================================================================
// Mechanic Requests — Client Barrel
// ============================================================================
//
// Public surface of the mechanic-requests feature module. Import from
// "@/lib/features/mechanic-requests" only — never import internals directly.
// Server-only exports (services) live in the services.ts file (server barrel).

// Types
export type { MechanicRequest, MechanicRequestStatus } from "./types";

// Schemas
export { createMechanicRequestSchema } from "./schemas";
export type { CreateMechanicRequestInput } from "./schemas";
