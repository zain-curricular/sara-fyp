// ============================================================================
// About Page
// ============================================================================
//
// Static marketing page describing ShopSmart's mission, team, and contact.

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

export const metadata: Metadata = {
	title: "About Us — ShopSmart",
	description:
		"ShopSmart is Pakistan's largest online marketplace for genuine and aftermarket auto parts.",
};

// ----------------------------------------------------------------------------
// Stat card
// ----------------------------------------------------------------------------

function StatCard({ value, label }: { value: string; label: string }) {
	return (
		<Card size="sm">
			<CardContent className="flex flex-col items-center gap-1 py-6 text-center">
				<p className="text-3xl font-bold text-primary">{value}</p>
				<p className="text-sm text-muted-foreground">{label}</p>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function AboutPage() {
	return (
		<div container-id="about-page" className="mx-auto max-w-3xl px-4 py-12">

			{/* Hero */}
			<div container-id="about-hero" className="mb-12 flex flex-col gap-4 text-center">
				<h1 className="text-4xl font-bold tracking-tight">
					Pakistan's largest auto parts marketplace
				</h1>
				<p className="text-lg text-muted-foreground">
					ShopSmart connects buyers with thousands of verified sellers across Pakistan — making
					it easy to find genuine and aftermarket parts at the right price.
				</p>
			</div>

			{/* Stats */}
			<div
				container-id="about-stats"
				className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
			>
				<StatCard value="50,000+" label="Parts listed" />
				<StatCard value="3,500+" label="Verified sellers" />
				<StatCard value="25+" label="Cities covered" />
				<StatCard value="4.8★" label="Buyer rating" />
			</div>

			<Separator className="mb-12" />

			{/* Mission */}
			<div container-id="about-mission" className="mb-12 flex flex-col gap-4">
				<h2 className="text-2xl font-bold">Our mission</h2>
				<p className="text-muted-foreground leading-relaxed">
					Car ownership in Pakistan is often complicated by unreliable parts sourcing,
					opaque pricing, and difficult-to-find specialists. ShopSmart exists to fix that.
					We provide a transparent marketplace where every listing is verified, every
					transaction is protected by escrow, and every mechanic is certified.
				</p>
				<p className="text-muted-foreground leading-relaxed">
					We believe every Pakistani driver — whether in Karachi, Lahore, or Quetta —
					deserves access to quality parts at fair prices, with the confidence of knowing
					exactly what they're buying.
				</p>
			</div>

			<Separator className="mb-12" />

			{/* Values */}
			<div container-id="about-values" className="mb-12 flex flex-col gap-6">
				<h2 className="text-2xl font-bold">What we stand for</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{[
						{
							title: "Transparency",
							body: "Real prices, real sellers, real reviews. No hidden fees.",
						},
						{
							title: "Buyer protection",
							body: "Every order is covered by escrow until you confirm delivery.",
						},
						{
							title: "Mechanic verification",
							body: "Certified mechanics inspect compatibility before you pay.",
						},
					].map(({ title, body }) => (
						<Card key={title} size="sm">
							<CardContent className="flex flex-col gap-2 pt-4">
								<p className="font-semibold">{title}</p>
								<p className="text-sm text-muted-foreground">{body}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator className="mb-12" />

			{/* Contact */}
			<div container-id="about-contact" className="flex flex-col gap-4">
				<h2 className="text-2xl font-bold">Get in touch</h2>
				<p className="text-muted-foreground">
					Questions, partnerships, or press enquiries — we'd love to hear from you.
				</p>
				<div className="flex flex-col gap-2 text-sm">
					<p>
						<span className="font-medium">Email: </span>
						<a
							href="mailto:support@shopsmart.pk"
							className="text-primary underline-offset-4 hover:underline"
						>
							support@shopsmart.pk
						</a>
					</p>
					<p>
						<span className="font-medium">Address: </span>
						Karachi, Pakistan
					</p>
				</div>
				<div className="flex gap-3 pt-2">
					<Link href="/contact">
						<Button variant="outline">Contact us</Button>
					</Link>
					<Link href="/sell-on-shopsmart">
						<Button>Start selling</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
