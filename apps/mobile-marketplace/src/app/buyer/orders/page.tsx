// ============================================================================
// Buyer Orders List Page
// ============================================================================
//
// RSC entry point for /buyer/orders. No orders API exists yet — the shell
// renders placeholder data. When the API ships, fetch here and pass as props.

import OrdersShell from "./shell";

export default function BuyerOrdersPage() {
	return <OrdersShell />;
}
