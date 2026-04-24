// ============================================================================
// Buyer Layout
// ============================================================================
//
// Sidebar navigation layout for authenticated buyer routes. Fixed sidebar on
// desktop, horizontal scrollable nav on mobile. Wraps content in AppShell.

import Link from "next/link";
import {
	Heart,
	Home,
	MapPin,
	Package,
	Settings,
	ShieldAlert,
	UserCircle,
	Wrench,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const NAV_LINKS = [
	{ href: "/buyer", label: "Dashboard", icon: Home },
	{ href: "/buyer/orders", label: "My Orders", icon: Package },
	{ href: "/buyer/favorites", label: "Saved", icon: Heart },
	{ href: "/buyer/addresses", label: "Addresses", icon: MapPin },
	{ href: "/buyer/disputes", label: "Disputes", icon: ShieldAlert },
	{ href: "/buyer/mechanic-requests", label: "Inspections", icon: Wrench },
	{ href: "/buyer/settings/profile", label: "Profile", icon: UserCircle },
	{ href: "/buyer/settings/avatar", label: "Settings", icon: Settings },
] as const;

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
	return (
		<AppShell>
			<div container-id="buyer-layout" className="flex flex-col gap-6 lg:flex-row lg:gap-8">

				{/* Sidebar */}
				<aside
					container-id="buyer-sidebar"
					className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible"
				>
					<div className="mb-2 hidden items-center gap-2 px-2 lg:flex">
						<UserCircle className="size-4 text-primary" aria-hidden />
						<span className="text-sm font-semibold">My Account</span>
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
				<main container-id="buyer-main" className="min-w-0 flex-1">
					{children}
				</main>
			</div>
		</AppShell>
	);
}
