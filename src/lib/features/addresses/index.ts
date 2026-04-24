// ============================================================================
// Addresses — Client Barrel
// ============================================================================
//
// Public surface of the addresses feature module. Import from
// "@/lib/features/addresses" only — never import internals directly.
// Server-only exports (services) live in "@/lib/features/addresses/services".

// Types
export type { SavedAddress } from "./types";

// Schemas
export { addressSchema } from "./schemas";
export type { AddressInput } from "./schemas";

// Hooks (client only — "use client" declared inside hooks.ts)
export {
	useAddresses,
	useCreateAddress,
	useDeleteAddress,
	useSetDefaultAddress,
	useUpdateAddress,
} from "./hooks";
