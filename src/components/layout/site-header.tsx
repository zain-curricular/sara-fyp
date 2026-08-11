// ============================================================================
// Site Header
// ============================================================================
//
// Sticky top navigation bar. OLX-inspired layout: logo left, search centre,
// nav links and auth actions right. Collapses gracefully on mobile.
//
// The notification bell subscribes to Supabase Realtime and shows a live
// unread count badge. The header is a server component that renders the
// NotificationBell client island for the realtime subscription.

import Link from "next/link";
import { Search, Heart, ShoppingCart, LogOut } from "lucide-react";

import { getServerSession } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

import { NotificationBell } from "@/components/layout/notification-bell";
import { MessagesBell } from "@/components/layout/messages-bell";
import { HeaderSearch } from "@/components/layout/header-search";

// "Browse" enters the vehicle catalog (brand → model), "Parts" enters the
// part-category catalog. Two distinct trees, two distinct routes — /browse
// takes no query params, so anything like ?type=parts is silently ignored.
const navLinks = [
	{ label: "Browse", href: "/browse" },
	{ label: "Parts", href: "/parts" },
	{ label: "Sell", href: "/seller/listings/new" },
	{ label: "Help", href: "/help" },
] as const;

const navLinkClass =
	"text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export async function SiteHeader() {
	// Drives the auth action on the right — sign in vs. log out.
	const session = await getServerSession();

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
						Shop<span className="text-primary">Smart</span>
					</span>
				</Link>

				{/* Search bar (client island — typing + submit) — hidden on mobile */}
				<HeaderSearch className="hidden flex-1 sm:flex" />

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

					{/* Messages (client island — unread badge) */}
					<MessagesBell />

					{/* Notification bell (client island — realtime + badge) */}
					<NotificationBell />

					{/* Cart */}
					<Link
						href="/cart"
						className={cn(
							buttonVariants({ variant: "ghost", size: "icon" }),
							"relative",
						)}
						aria-label="Shopping cart"
					>
						<ShoppingCart className="size-4" />
						{/* Cart count badge is server-rendered — wrap in Suspense */}
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

					{/*
					  Log out posts to the API route rather than linking to the
					  /logout page: Next prefetches links in the viewport, and
					  prefetching a GET route that signs you out would log the
					  user out on its own. A form POST is never prefetched.
					*/}
					{session ? (
						<form action="/api/auth/logout" method="post">
							<button
								type="submit"
								className={cn(
									buttonVariants({ variant: "outline", size: "sm" }),
									"gap-1.5",
								)}
							>
								<LogOut className="size-4" />
								<span className="text-xs sm:text-sm">Log out</span>
							</button>
						</form>
					) : (
						<Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
							Sign in
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
