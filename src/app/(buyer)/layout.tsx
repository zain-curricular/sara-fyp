// ============================================================================
// Buyer Route Group Layout
// ============================================================================
//
// Wraps cart, checkout, and other buyer-specific routes in the shared app
// shell (header + footer + max-width container).

import { AppShell } from "@/components/layout/app-shell";

export default function BuyerGroupLayout({ children }: { children: React.ReactNode }) {
	return <AppShell>{children}</AppShell>;
}
