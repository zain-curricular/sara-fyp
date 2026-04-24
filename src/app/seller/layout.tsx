// ============================================================================
// Seller Layout
// ============================================================================
//
// Sidebar navigation layout for all seller routes. Fixed sidebar on desktop,
// horizontal scrollable nav on mobile. Wraps content in AppShell.

import Link from "next/link";
import {
	BarChart2,
	Box,
	CreditCard,
	LayoutDashboard,
	MessageSquare,
	Package,
	Settings,
	ShieldAlert,
	Star,
	Store,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const NAV_LINKS = [
	{ href: "/seller", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/seller/listings", label: "Listings", icon: Box },
	{ href: "/seller/orders", label: "Orders", icon: Package },
	{ href: "/seller/analytics", label: "Analytics", icon: BarChart2 },
	{ href: "/seller/reviews", label: "Reviews", icon: Star },
	{ href: "/seller/disputes", label: "Disputes", icon: ShieldAlert },
	{ href: "/seller/payouts", label: "Payouts", icon: CreditCard },
	{ href: "/seller/store", label: "Store Profile", icon: Store },
	{ href: "/messages", label: "Messages", icon: MessageSquare },
	{ href: "/seller/settings/shipping", label: "Shipping", icon: Settings },
] as const;

export default function SellerLayout({ children }: { children: React.ReactNode }) {
	return (
		<AppShell>
			<div container-id="seller-layout" className="flex flex-col gap-6 lg:flex-row lg:gap-8">

				{/* Sidebar */}
				<aside
					container-id="seller-sidebar"
					className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible"
				>
					<div className="mb-2 hidden items-center gap-2 px-2 lg:flex">
						<Store className="size-4 text-primary" aria-hidden />
						<span className="text-sm font-semibold">Seller Panel</span>
					</div>

					{NAV_LINKS.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Icon className="size-4 shrink-0" aria-hidden />
							<span>{label}</span>
						</Link>
					))}
				</aside>

				{/* Main content */}
				<main container-id="seller-main" className="min-w-0 flex-1">
					{children}
				</main>
			</div>
		</AppShell>
	);
}
