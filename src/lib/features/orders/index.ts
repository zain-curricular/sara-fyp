// ============================================================================
// Orders — Client Barrel
// ============================================================================
//
// Public surface of the orders feature module.
// Import from "@/lib/features/orders" only — never import internals directly.
// Server-only exports (services) live in "@/lib/features/orders/services".

// Types
export type {
	Order,
	OrderItem,
	OrderStatus,
	OrderStatusEvent,
	ShippingAddress,
} from "./types";

// Schemas + inferred input types
export { placeOrderSchema, shipOrderSchema, transitionOrderSchema } from "./schemas";
export type { PlaceOrderInput, ShipOrderInput, TransitionOrderInput } from "./schemas";

// Hooks (client only — "use client" declared inside hooks.ts)
export {
	useAcceptOrder,
	useBuyerOrders,
	useConfirmReceipt,
	useOrderDetail,
	usePlaceOrder,
	useSellerOrders,
	useShipOrder,
} from "./hooks";
