// ============================================================================
// Cart — Client Barrel
// ============================================================================
//
// Public surface of the cart feature module.
// Import from "@/lib/features/cart" only — never import internals directly.
// Server-only exports live in "@/lib/features/cart/services".

// Types
export type { Cart, CartItem, CartSummary, SellerGroup } from "./types";

// Schemas + inferred types
export { addToCartSchema, updateCartItemSchema } from "./schemas";
export type { AddToCartInput, UpdateCartItemInput } from "./schemas";

// Hooks (client only — "use client" is declared inside hooks.ts)
export { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "./hooks";
