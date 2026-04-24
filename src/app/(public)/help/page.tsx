// ============================================================================
// Help Centre — Index Page
// ============================================================================
//
// FAQ overview page. Groups questions into sections (Buying, Selling,
// Payments, Disputes, Mechanic Verification). Each section expands inline
// using native details/summary for zero-JS accordion.

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

export const metadata: Metadata = {
	title: "Help Centre — ShopSmart",
	description: "Find answers to common questions about buying, selling, payments, and more on ShopSmart.",
};

// ----------------------------------------------------------------------------
// Data
// ----------------------------------------------------------------------------

type FAQ = { q: string; a: string };

const SECTIONS: { slug: string; title: string; faqs: FAQ[] }[] = [
	{
		slug: "buying",
		title: "Buying",
		faqs: [
			{
				q: "How do I find the right part for my car?",
				a: "Use the search bar to filter by make, model, year, and part category. You can also request a mechanic verification to confirm compatibility before paying.",
			},
			{
				q: "Is it safe to buy on ShopSmart?",
				a: "Yes. All payments are held in escrow until you confirm the part is received and matches the listing. You have 3 days to raise a dispute after delivery.",
			},
			{
				q: "Can I return a part?",
				a: "Returns are subject to the seller's return policy, shown on each listing. ShopSmart mediates disputes if the part is not as described.",
			},
			{
				q: "How long does delivery take?",
				a: "Delivery times vary by seller and city. Most sellers within Pakistan ship in 2–5 business days. Check the listing for seller-specific estimates.",
			},
		],
	},
	{
		slug: "selling",
		title: "Selling",
		faqs: [
			{
				q: "How do I start selling?",
				a: "Create an account, go to your seller dashboard, and submit your first listing. You'll need to verify your identity before receiving payments.",
			},
			{
				q: "What fee does ShopSmart charge?",
				a: "ShopSmart charges a 5% platform fee on each successful sale. There are no listing fees.",
			},
			{
				q: "How quickly do I get paid?",
				a: "Once the buyer confirms receipt (or 3 days pass without a dispute), funds are released to your wallet within 1–2 business days.",
			},
		],
	},
	{
		slug: "payments",
		title: "Payments",
		faqs: [
			{
				q: "What payment methods are accepted?",
				a: "We accept JazzCash, Easypaisa, and bank transfer. Card payments are coming soon.",
			},
			{
				q: "Is my payment secure?",
				a: "All payments go through escrow — they are held securely and only released to the seller after you confirm delivery.",
			},
			{
				q: "Can I get a refund?",
				a: "If a dispute is resolved in your favour, the escrowed funds are returned to your ShopSmart wallet within 3–5 business days.",
			},
		],
	},
	{
		slug: "disputes",
		title: "Disputes",
		faqs: [
			{
				q: "How do I raise a dispute?",
				a: "Go to your order, tap 'Raise dispute', and describe the issue. Attach photos if the part is damaged or incorrect.",
			},
			{
				q: "How long do disputes take to resolve?",
				a: "Our team aims to resolve disputes within 5 business days. Complex cases involving mechanic inspection may take longer.",
			},
			{
				q: "What happens if the seller doesn't respond?",
				a: "If the seller does not respond within 48 hours, the dispute is automatically decided in the buyer's favour.",
			},
		],
	},
	{
		slug: "mechanic-verification",
		title: "Mechanic Verification",
		faqs: [
			{
				q: "What is mechanic verification?",
				a: "Before you buy a part, you can request a certified ShopSmart mechanic to review the listing and confirm it is compatible with your vehicle.",
			},
			{
				q: "How much does it cost?",
				a: "Mechanic verification costs PKR 500 per request, deducted from your wallet.",
			},
			{
				q: "How long does verification take?",
				a: "Most verifications are completed within 24 hours of a mechanic accepting the request.",
			},
			{
				q: "Are all mechanics certified?",
				a: "Yes. Every mechanic on ShopSmart has completed our onboarding process, including identity verification and a technical assessment.",
			},
		],
	},
];

// ----------------------------------------------------------------------------
// FAQ accordion item (native details/summary)
// ----------------------------------------------------------------------------

function FaqItem({ faq }: { faq: FAQ }) {
	return (
		<details className="group border-b last:border-b-0">
			<summary className="flex cursor-pointer select-none items-center justify-between gap-4 py-3 text-sm font-medium">
				{faq.q}
				<ChevronRight
					className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
					aria-hidden
				/>
			</summary>
			<p className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
		</details>
	);
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function HelpPage() {
	return (
		<div container-id="help-page" className="mx-auto max-w-3xl px-4 py-12">

			{/* Header */}
			<div container-id="help-header" className="mb-10 flex flex-col gap-2 text-center">
				<h1 className="text-4xl font-bold tracking-tight">Help Centre</h1>
				<p className="text-lg text-muted-foreground">
					Find answers to common questions about ShopSmart.
				</p>
			</div>

			{/* Sections */}
			<div container-id="help-sections" className="flex flex-col gap-6">
				{SECTIONS.map((section) => (
					<Card key={section.slug} size="sm">
						<CardContent className="pt-4">

							{/* Section header with link to dedicated page */}
							<div className="mb-3 flex items-center justify-between">
								<h2 className="font-semibold">{section.title}</h2>
								<Link
									href={`/help/${section.slug}`}
									className="text-xs text-primary underline-offset-4 hover:underline"
								>
									See all
								</Link>
							</div>

							<Separator className="mb-3" />

							{/* FAQs */}
							<div>
								{section.faqs.map((faq) => (
									<FaqItem key={faq.q} faq={faq} />
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Still need help */}
			<div container-id="help-cta" className="mt-10 text-center">
				<p className="text-muted-foreground text-sm">
					Can't find what you're looking for?{" "}
					<Link
						href="/contact"
						className="text-primary underline-offset-4 hover:underline"
					>
						Contact our support team
					</Link>
				</p>
			</div>
		</div>
	);
}
