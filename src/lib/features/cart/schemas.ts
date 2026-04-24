// ============================================================================
// Cart — Zod Schemas
// ============================================================================
//
// Input validation for cart mutations. Used in API route handlers and on the
// client before submitting mutations.

import { z } from "zod";

/** POST /api/cart/items — add a listing to cart */
export const addToCartSchema = z.object({
	listingId: z.string().uuid("listingId must be a valid UUID"),
	qty: z.number().int().min(1, "qty must be at least 1").max(100, "qty cannot exceed 100"),
});

/** PATCH /api/cart/items/[id] — update qty of an existing cart item */
export const updateCartItemSchema = z.object({
	qty: z.number().int().min(1, "qty must be at least 1").max(100, "qty cannot exceed 100"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
