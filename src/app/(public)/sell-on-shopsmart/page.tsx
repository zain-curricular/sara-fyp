// ============================================================================
// Sell on ShopSmart — Marketing Page
// ============================================================================
//
// Explains the benefits of selling on ShopSmart: PKR payments, escrow
// protection, and the 5% fee. Includes a CTA button to /become-a-seller.

import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, DollarSign, ShieldCheck, Store, TrendingUp, Truck } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

export const metadata: Metadata = {
	title: "Sell on ShopSmart — Pakistan's Auto Parts Marketplace",
	description:
		"List your auto parts on ShopSmart and reach thousands of buyers across Pakistan. PKR payments, escrow protection, and just 5% per sale.",
};

// ----------------------------------------------------------------------------
// Benefit card
// ----------------------------------------------------------------------------

function BenefitCard({
	icon: Icon,
	title,
	body,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	body: string;
}) {
	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-3 pt-4">
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<Icon className="size-5 text-primary" aria-hidden />
				</div>
				<p className="font-semibold">{title}</p>
				<p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Step item
// ----------------------------------------------------------------------------

function Step({ number, title, body }: { number: number; title: string; body: string }) {
	return (
		<div container-id="how-it-works-step" className="flex gap-4">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
				{number}
			</div>
			<div className="flex flex-col gap-0.5">
				<p className="font-semibold">{title}</p>
				<p className="text-sm text-muted-foreground">{body}</p>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function SellOnShopSmartPage() {
	return (
		<div container-id="sell-page" className="mx-auto max-w-4xl px-4 py-12">

			{/* Hero */}
			<div container-id="sell-hero" className="mb-14 flex flex-col items-center gap-5 text-center">
				<div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
					<Store className="size-7 text-primary" aria-hidden />
				</div>
				<h1 className="text-4xl font-bold tracking-tight">
					Grow your parts business on ShopSmart
				</h1>
				<p className="max-w-xl text-lg text-muted-foreground">
					Reach thousands of verified buyers across Pakistan. List your parts in minutes,
					get paid securely in PKR, and grow with tools built for auto parts sellers.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Link href="/become-a-seller">
						<Button size="lg">Start selling — it's free</Button>
					</Link>
					<Link href="/contact">
						<Button size="lg" variant="outline">Talk to our team</Button>
					</Link>
				</div>
			</div>

			{/* Key benefits */}
			<div container-id="sell-benefits" className="mb-14 flex flex-col gap-6">
				<h2 className="text-2xl font-bold">Why sell on ShopSmart?</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<BenefitCard
						icon={DollarSign}
						title="PKR payments"
						body="All transactions are settled in Pakistani Rupees. No foreign exchange hassle, no conversion fees."
					/>
					<BenefitCard
						icon={ShieldCheck}
						title="Escrow protection"
						body="Funds are held in escrow until the buyer confirms delivery — you always get paid for genuine orders."
					/>
					<BenefitCard
						icon={TrendingUp}
						title="Just 5% per sale"
						body="No listing fees. No monthly subscriptions. Pay a flat 5% only when you make a sale."
					/>
					<BenefitCard
						icon={BadgeCheck}
						title="Verified buyer network"
						body="Every buyer goes through phone verification. You deal with real people, not bots."
					/>
					<BenefitCard
						icon={Truck}
						title="Courier integrations"
						body="Connect with TCS, Leopards, and other couriers directly from your seller dashboard."
					/>
					<BenefitCard
						icon={Store}
						title="Seller storefront"
						body="Get your own branded storefront page showcasing all your listings and seller ratings."
					/>
				</div>
			</div>

			<Separator className="mb-14" />

			{/* How it works */}
			<div container-id="sell-how" className="mb-14 flex flex-col gap-6">
				<h2 className="text-2xl font-bold">How it works</h2>
				<div className="flex flex-col gap-5">
					<Step
						number={1}
						title="Create your account"
						body="Sign up with your phone number and complete identity verification in under 5 minutes."
					/>
					<Step
						number={2}
						title="List your parts"
						body="Add photos, set your price, and describe the part. Listings go live instantly."
					/>
					<Step
						number={3}
						title="Receive orders"
						body="Buyers place orders and funds are held in escrow. You get a notification to ship."
					/>
					<Step
						number={4}
						title="Ship and get paid"
						body="Once the buyer confirms receipt, funds are released to your wallet. Withdraw anytime."
					/>
				</div>
			</div>

			<Separator className="mb-14" />

			{/* Pricing */}
			<div container-id="sell-pricing" className="mb-14 flex flex-col gap-4">
				<h2 className="text-2xl font-bold">Simple pricing</h2>
				<div className="rounded-xl border p-6">
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="text-4xl font-bold text-primary">5%</span>
						<span className="text-muted-foreground">per successful sale</span>
					</div>
					<ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
						{[
							"No listing fees",
							"No monthly or annual subscription",
							"No courier fees (courier rates apply separately)",
							"No fee on disputed or cancelled orders",
						].map((item) => (
							<li key={item} className="flex items-center gap-2">
								<BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* CTA */}
			<div container-id="sell-cta" className="flex flex-col items-center gap-4 text-center">
				<h2 className="text-2xl font-bold">Ready to start selling?</h2>
				<p className="text-muted-foreground">
					Join 3,500+ sellers already growing their business on ShopSmart.
				</p>
				<Link href="/become-a-seller">
					<Button size="lg">Create your seller account</Button>
				</Link>
			</div>
		</div>
	);
}
