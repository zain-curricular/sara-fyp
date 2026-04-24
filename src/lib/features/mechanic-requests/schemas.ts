// ============================================================================
// Mechanic Requests — Zod Schemas
// ============================================================================
//
// Validation schema for creating a mechanic verification request.
// agreeToFee must be true — used to confirm the buyer accepted the PKR 500 fee.

import { z } from "zod";

export const createMechanicRequestSchema = z.object({
	listingId: z.string().uuid("Invalid listing ID"),
	vehicleId: z.string().uuid("Invalid vehicle ID"),
	notes: z.string().optional(),
	agreeToFee: z.literal(true),
});

export type CreateMechanicRequestInput = z.infer<typeof createMechanicRequestSchema>;
