// ============================================================================
// UUID validation
// ============================================================================
//
// Zod v4's `.uuid()` enforces RFC-4122 version/variant bits, which rejects the
// deterministic demo-seed identifiers (e.g. `c5000000-0000-0000-0000-…`) whose
// version/variant nibbles are `0`. Those ids are real, stable primary keys used
// throughout the seeded dataset, so every ID-validating endpoint (cart, orders,
// favorites, mechanic requests, …) would 422 on them.
//
// This helper validates the structural UUID shape (8-4-4-4-12 hex) without the
// RFC version/variant constraint — strong enough for entity-id validation while
// accepting both real UUIDs and the seed's identifiers.

import { z } from "zod";

/** Structural UUID: 8-4-4-4-12 hex, case-insensitive (no RFC version/variant check). */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A Zod string schema that accepts any structurally-valid UUID. */
export function uuid(message = "Must be a valid UUID") {
	return z.string().regex(UUID_REGEX, message);
}
