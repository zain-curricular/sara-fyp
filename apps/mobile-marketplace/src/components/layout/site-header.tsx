// ============================================================================
// Site Header
// ============================================================================
//
// Sticky top navigation bar. OLX-inspired layout: logo left, search centre,
// nav links and auth actions right. Collapses gracefully on mobile.
//

import Link from "next/link";
import { Bell, MessageSquare, Search, Heart } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

const navLinks = [
	{ label: "Browse", href: "/browse" },
	{ label: "Auctions", href: "/browse?type=auction" },
	{ label: "Sell", href: "/seller/listings/new" },
	{ label: "Help", href: "#" },
] as const;

const navLinkClass =
	"text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
	return (
		<header
			container-id="site-header"
			className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
		>
			<div
				container-id="site-header-inner"
				className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:h-16 sm:gap-5 sm:px-6 lg:px-8"
			>

				{/* Logo */}
				<Link
					href="/"
					container-id="site-header-logo"
					className="flex shrink-0 items-center gap-2"
				>
					<span className="size-2.5 rounded-full bg-brand" />
					<span className="text-sm font-bold tracking-tight sm:text-base">
						mobile<span className="text-primary">mart</span>
					</span>
				</Link>

				{/* Search bar — hidden on mobile */}
				<Link
					href="/search"
					container-id="site-header-search"
					className="hidden flex-1 items-center gap-2.5 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
				>
					<Search className="size-3.5 shrink-0" />
					<span>Search phones, brands, models…</span>
				</Link>

				{/* Desktop nav */}
				<nav
					aria-label="Main"
					container-id="site-header-nav"
					className="hidden items-center gap-6 lg:flex"
				>
					{navLinks.map(({ label, href }) => (
						<Link key={label} href={href} className={navLinkClass}>
							{label}
						</Link>
					))}
				</nav>

				{/* Actions */}
				<div
					container-id="site-header-actions"
					className="ml-auto flex items-center gap-2 sm:ml-0"
				>
					{/* Mobile search icon */}
					<Link
						href="/search"
						className={cn(
							buttonVariants({ variant: "ghost", size: "icon" }),
							"sm:hidden",
						)}
						aria-label="Search"
					>
						<Search className="size-4" />
					</Link>

					{/* Messages */}
					<Link
						href="/messages"
						className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
						aria-label="Messages"
					>
						<MessageSquare className="size-4" />
					</Link>

					{/* Notifications */}
					<Link
						href="/notifications"
						className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
						aria-label="Notifications"
					>
						<Bell className="size-4" />
					</Link>

					{/* Saved */}
					<Link
						href="/buyer/favorites"
						className={cn(
							buttonVariants({ variant: "ghost", size: "sm" }),
							"hidden gap-1.5 sm:flex",
						)}
					>
						<Heart className="size-4" />
						<span className="text-xs">Saved</span>
					</Link>

					<Link
						href="/sign-in"
						className={cn(buttonVariants({ size: "sm" }))}
					>
						Sign in
					</Link>
				</div>
			</div>
		</header>
	);
}
