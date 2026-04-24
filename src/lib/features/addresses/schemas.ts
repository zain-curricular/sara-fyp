// ============================================================================
// Addresses — Zod Schemas
// ============================================================================
//
// Validation schemas for address create/update operations. Phone validation
// enforces Pakistan mobile format: 03XX-XXXXXXX or +923XXXXXXXXX.

import { z } from "zod";

export const addressSchema = z.object({
	label: z.string().min(1),
	fullName: z.string().min(2, "Full name must be at least 2 characters"),
	phone: z
		.string()
		.regex(
			/^(\+92|0)3[0-9]{9}$/,
			"Enter a valid Pakistani mobile number (e.g. 03001234567)",
		),
	addressLine: z.string().min(5, "Address line is required"),
	city: z.string().min(2, "City is required"),
	province: z.string().min(2, "Province is required"),
	isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;
