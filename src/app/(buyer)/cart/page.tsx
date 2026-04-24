// ============================================================================
// Cart Page — RSC
// ============================================================================
//
// Authenticates, SSR-fetches the cart, and passes data to CartShell.
// Redirects unauthenticated users to /sign-in?next=/cart.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getCartWithItems } from "@/lib/features/cart/services";
import CartShell from "./shell";

export const metadata = { title: "My Cart — ShopSmart" };

export default async function CartPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/cart");

	const { data: cart, error } = await getCartWithItems(session.userId);
	if (error) throw new Error("Failed to load cart");

	return <CartShell initialCart={cart} />;
}
