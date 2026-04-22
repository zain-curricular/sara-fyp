// ============================================================================
// Buyer Dashboard Shell
// ============================================================================
//
// Activity-first home base after login (Wireframe Variant A). Shows live bids,
// orders in transit, watching count, ending-soon auction table, and a recently
// viewed mini-grid. All figures are placeholder — no bids/orders API yet.
//
// Profile display name fetched client-side via useMyProfile so the RSC stays
// statically renderable. Falls back to "there" if not loaded yet.

"use client";

import Link from "next/link";
import { Clock, Heart, Package, Settings, ShoppingBag, Gavel } from "lucide-react";

import { useMyProfile } from "@/lib/features/profiles/hooks";
import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

const MOCK_AUCTIONS = [
	{ name: "iPhone 14 Pro", price: "$512", status: "leading", endsIn: "3m" },
	{ name: "Pixel 8", price: "$280", status: "outbid", endsIn: "42m" },
	{ name: "Galaxy S23 Ultra", price: "$620", status: "leading", endsIn: "2h" },
] as const;

const MOCK_VIEWED = [
	{ name: "iPhone 13", price: "$300" },
	{ name: "iPhone SE 3", price: "$340" },
	{ name: "Galaxy S24", price: "$380" },
	{ name: "Pixel 8", price: "$420" },
];

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function ActivityCard({
	icon: Icon,
	label,
	value,
	sub,
	href,
	cta,
	highlight,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
	sub: string;
	href: string;
	cta: string;
	highlight?: boolean;
}) {
	return (
		<Card size="sm" className={highlight ? "border-primary/30 bg-primary/5" : undefined}>
			<CardContent className="flex flex-col gap-2 pt-4">
				<div className="flex items-center gap-1.5">
					<Icon className={`size-3.5 ${highlight ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
					<p className={`text-xs font-medium ${highlight ? "text-primary" : "text-muted-foreground"}`}>
						{label}
					</p>
				</div>
				<p className="text-3xl font-bold tabular-nums">{value}</p>
				<p className="text-xs text-muted-foreground">{sub}</p>
				<Link
					href={href}
					className={buttonVariants({ variant: highlight ? "default" : "outline", size: "sm" })}
				>
					{cta}
				</Link>
			</CardContent>
		</Card>
	);
}

function AuctionRow({
	name,
	price,
	status,
	endsIn,
}: {
	name: string;
	price: string;
	status: "leading" | "outbid";
	endsIn: string;
}) {
	return (
		<div className="flex items-center justify-between py-2.5">
			<div className="flex flex-col gap-0.5">
				<p className="text-sm font-medium">{name}</p>
				<p className="text-xs text-muted-foreground">ends in {endsIn}</p>
			</div>
			<div className="flex flex-col items-end gap-1">
				<span className="text-sm font-bold tabular-nums text-primary">{price}</span>
				<Badge
					variant={status === "leading" ? "default" : "secondary"}
					className="rounded-sm text-[9px]"
				>
					{status}
				</Badge>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function BuyerShell() {
	const { data: profile } = useMyProfile();
	const firstName = profile?.display_name?.split(" ")[0] ?? "there";

	return (
		<div container-id="buyer-shell" className="flex flex-col gap-6">

			{/* Greeting */}
			<header container-id="buyer-header" className="flex flex-col gap-1">
				<p className="text-xs font-medium text-muted-foreground">Buyer dashboard</p>
				<h1 className="text-3xl font-bold tracking-tight">
					Hey {firstName},{" "}
					<span className="text-muted-foreground font-normal">welcome back.</span>
				</h1>
				<p className="text-sm text-muted-foreground">
					3 auctions you're in · 1 order shipped · 2 unread messages
				</p>
			</header>

			{/* Activity stat cards */}
			<div container-id="buyer-stats" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<ActivityCard
					icon={Gavel}
					label="active bids"
					value="3"
					sub="leading: iPhone 14 Pro · $512"
					href="/buyer/orders"
					cta="Go to bids →"
					highlight
				/>
				<ActivityCard
					icon={Package}
					label="orders in transit"
					value="1"
					sub="Arrives Thu Apr 24 · DHL"
					href="/buyer/orders"
					cta="Track →"
				/>
				<ActivityCard
					icon={Heart}
					label="watching"
					value="12"
					sub="2 ending soon · 1 price dropped"
					href="/buyer/favorites"
					cta="View →"
				/>
			</div>

			{/* Auctions + Recently viewed */}
			<div container-id="buyer-main" className="grid grid-cols-1 gap-4 lg:grid-cols-2">

				{/* Ending soon */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Auctions ending soon</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-0">
						{MOCK_AUCTIONS.map((a, i) => (
							<div key={a.name}>
								{i > 0 && <Separator />}
								<AuctionRow {...a} />
							</div>
						))}
					</CardContent>
				</Card>

				{/* Recently viewed */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Recently viewed</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2">
							{MOCK_VIEWED.map((item) => (
								<Link
									key={item.name}
									href="/search"
									className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/20 p-2 hover:bg-accent/40 transition-colors"
								>
									<div className="aspect-[4/3] w-full rounded bg-muted/40" />
									<p className="text-[11px] font-medium leading-tight">{item.name}</p>
									<p className="text-[11px] font-bold tabular-nums text-primary">{item.price}</p>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick nav */}
			<div container-id="buyer-quick-nav" className="flex flex-wrap gap-2">
				<Link href="/buyer/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
					<ShoppingBag className="size-3.5" aria-hidden />
					My orders
				</Link>
				<Link href="/buyer/favorites" className={buttonVariants({ variant: "outline", size: "sm" })}>
					<Heart className="size-3.5" aria-hidden />
					Favorites
				</Link>
				<Link href="/buyer/viewed" className={buttonVariants({ variant: "ghost", size: "sm" })}>
					<Clock className="size-3.5" aria-hidden />
					Recently viewed
				</Link>
				<Link href="/buyer/settings/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
					<Settings className="size-3.5" aria-hidden />
					Settings
				</Link>
			</div>
		</div>
	);
}
