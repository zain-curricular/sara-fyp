// ============================================================================
// Admin Sidebar Layout
// ============================================================================
//
// Collapsible sidebar navigation for the admin section. On mobile, sidebar
// is hidden by default and toggled via a hamburger button.
//
// Nav links:
//   /admin               Dashboard
//   /admin/users         Users
//   /admin/sellers       Sellers
//   /admin/listings      Listings
//   /admin/orders        Orders
//   /admin/disputes      Disputes
//   /admin/fraud         Fraud Signals
//   /admin/mechanics     Mechanics
//   /admin/categories    Categories
//   /admin/vehicles      Vehicles
//   /admin/kb            Knowledge Base
//   /admin/payouts       Payouts
//   /admin/settings      Settings

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	AlertTriangle,
	BarChart3,
	Book,
	ChevronRight,
	CreditCard,
	Gavel,
	Grid3X3,
	LayoutDashboard,
	Menu,
	Package,
	Settings,
	Shield,
	ShoppingBag,
	Users,
	Wrench,
	X,
} from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Nav config
// ----------------------------------------------------------------------------

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/sellers", label: "Sellers", icon: ShoppingBag },
	{ href: "/admin/listings", label: "Listings", icon: Package },
	{ href: "/admin/orders", label: "Orders", icon: BarChart3 },
	{ href: "/admin/disputes", label: "Disputes", icon: Gavel },
	{ href: "/admin/fraud", label: "Fraud Signals", icon: AlertTriangle },
	{ href: "/admin/mechanics", label: "Mechanics", icon: Wrench },
	{ href: "/admin/catalog", label: "Catalog", icon: Grid3X3 },
	{ href: "/admin/kb", label: "Knowledge Base", icon: Book },
	{ href: "/admin/payouts", label: "Payouts", icon: CreditCard },
	{ href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

// ----------------------------------------------------------------------------
// NavItem
// ----------------------------------------------------------------------------

function NavItem({
	href,
	label,
	icon: Icon,
	exact,
	onClick,
}: {
	href: string;
	label: string;
	icon: React.ElementType;
	exact?: boolean;
	onClick?: () => void;
}) {
	const pathname = usePathname();
	const isActive = exact ? pathname === href : pathname.startsWith(href);

	return (
		<Link
			href={href}
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "bg-primary text-primary-foreground"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			<Icon className="size-4 shrink-0" aria-hidden />
			{label}
			{isActive && <ChevronRight className="ml-auto size-3 shrink-0 opacity-60" aria-hidden />}
		</Link>
	);
}

// ----------------------------------------------------------------------------
// Sidebar content
// ----------------------------------------------------------------------------

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
	return (
		<div container-id="admin-sidebar-content" className="flex flex-col gap-1 p-3">

			<div className="mb-2 flex items-center gap-2 px-3 py-2">
				<Shield className="size-5 text-primary" aria-hidden />
				<span className="text-base font-semibold">Admin</span>
			</div>

			<Separator className="mb-2" />

			{NAV_ITEMS.map((item) => (
				<NavItem
					key={item.href}
					href={item.href}
					label={item.label}
					icon={item.icon}
					exact={"exact" in item ? item.exact : undefined}
					onClick={onNavClick}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Layout
// ----------------------------------------------------------------------------

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div container-id="admin-layout" className="flex min-h-screen flex-col">

			{/* Mobile topbar */}
			<header
				container-id="admin-mobile-header"
				className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden"
			>
				<div className="flex items-center gap-2">
					<Shield className="size-5 text-primary" aria-hidden />
					<span className="font-semibold">Admin</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setMobileOpen(true)}
					aria-label="Open navigation"
				>
					<Menu className="size-4" />
				</Button>
			</header>

			{/* Mobile drawer overlay */}
			{mobileOpen && (
				<div
					container-id="admin-mobile-overlay"
					className="fixed inset-0 z-50 flex lg:hidden"
					role="dialog"
					aria-modal
					aria-label="Navigation menu"
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setMobileOpen(false)}
					/>

					{/* Drawer */}
					<div
						container-id="admin-mobile-drawer"
						className="relative z-10 flex w-64 flex-col overflow-y-auto bg-background shadow-xl"
					>
						<div className="flex items-center justify-between border-b border-border p-3">
							<span className="font-semibold">Navigation</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMobileOpen(false)}
								aria-label="Close navigation"
							>
								<X className="size-4" />
							</Button>
						</div>
						<SidebarContent onNavClick={() => setMobileOpen(false)} />
					</div>
				</div>
			)}

			{/* Desktop layout */}
			<div container-id="admin-body" className="flex flex-1">

				{/* Desktop sidebar */}
				<aside
					container-id="admin-sidebar"
					className="hidden w-56 shrink-0 border-r border-border bg-background lg:flex lg:flex-col"
				>
					<div className="sticky top-0 overflow-y-auto">
						<SidebarContent />
					</div>
				</aside>

				{/* Page content */}
				<main
					container-id="admin-main"
					className="flex flex-1 flex-col overflow-auto p-4 sm:p-6"
				>
					{children}
				</main>
			</div>
		</div>
	);
}
