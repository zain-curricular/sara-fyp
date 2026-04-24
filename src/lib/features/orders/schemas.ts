// ============================================================================
// Orders — Zod Schemas
// ============================================================================
//
// Input validation for order mutations. placeOrderSchema is the primary
// checkout payload. shipOrderSchema is used by sellers when marking shipped.

import { z } from "zod";

import type { OrderStatus } from "@/lib/features/orders/types";

const shippingAddressSchema = z.object({
	fullName: z.string().min(2, "Full name required"),
	phone: z.string().min(10, "Valid phone number required"),
	addressLine: z.string().min(5, "Address is required"),
	city: z.string().min(2, "City is required"),
	province: z.string().min(2, "Province is required"),
});

/** POST /api/orders — place order for one seller group from cart */
export const placeOrderSchema = z.object({
	cartGroupSellerId: z.string().uuid("cartGroupSellerId must be a valid UUID"),
	shippingAddressId: z.string().uuid().nullable().optional(),
	shippingAddress: shippingAddressSchema.nullable(),
	paymentMethod: z.enum(["cod", "jazzcash", "easypaisa", "card"]),
});

/** POST /api/orders/[id]/ship — seller marks order shipped */
export const shipOrderSchema = z.object({
	trackingNumber: z.string().min(3, "Tracking number is required"),
	courierName: z.string().min(2, "Courier name is required"),
});

/** Generic status transition — used internally and in admin routes */
export const transitionOrderSchema = z.object({
	toStatus: z.enum([
		"pending_payment",
		"paid_escrow",
		"accepted",
		"shipped",
		"delivered",
		"completed",
		"disputed",
		"refunded",
		"cancelled",
	]) satisfies z.ZodType<OrderStatus>,
	note: z.string().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;
