// ============================================================================
// Mechanic Requests — Zod Schemas
// ============================================================================
//
// Validation schema for creating a mechanic verification request.
// agreeToFee must be true — used to confirm the buyer accepted the PKR 500 fee.

import { z } from "zod";
import { uuid } from "@/lib/validation/uuid";

export const createMechanicRequestSchema = z.object({
	listingId: uuid("Invalid listing ID"),
	vehicleId: uuid("Invalid vehicle ID"),
	notes: z.string().optional(),
	agreeToFee: z.literal(true),
});

export type CreateMechanicRequestInput = z.infer<typeof createMechanicRequestSchema>;
