// ============================================================================
// Mechanic Layout
// ============================================================================
//
// Sidebar navigation layout for all mechanic routes. Uses a two-column
// approach: fixed sidebar on desktop, top nav on mobile.
// Wraps in AppShell for header/footer.

import Link from "next/link";
import { Briefcase, CheckCircle2, DollarSign, LayoutDashboard, Settings, Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const NAV_LINKS = [
	{ href: "/mechanic", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/mechanic/requests", label: "Requests", icon: Wrench },
	{ href: "/mechanic/completed", label: "Completed", icon: CheckCircle2 },
	{ href: "/mechanic/earnings", label: "Earnings", icon: DollarSign },
	{ href: "/mechanic/settings", label: "Settings", icon: Settings },
] as const;

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
	return (
		<AppShell>
			<div container-id="mechanic-layout" className="flex flex-col gap-6 lg:flex-row lg:gap-8">

				{/* Sidebar */}
				<aside
					container-id="mechanic-sidebar"
					className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible"
				>
					<div className="mb-2 hidden items-center gap-2 px-2 lg:flex">
						<Briefcase className="size-4 text-primary" aria-hidden />
						<span className="text-sm font-semibold">Mechanic Panel</span>
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
				<main container-id="mechanic-main" className="min-w-0 flex-1">
					{children}
				</main>
			</div>
		</AppShell>
	);
}
