// ============================================================================
// Help Centre — Section Detail Page
// ============================================================================
//
// Dynamic page for each FAQ section (buying, selling, payments, disputes,
// mechanic-verification). Statically generated from a fixed dataset.
// Unknown slugs return 404 via notFound().

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Data (same source as help/page.tsx — kept in sync)
// ----------------------------------------------------------------------------

type FAQ = { q: string; a: string };

const SECTIONS: Record<string, { title: string; description: string; faqs: FAQ[] }> = {
	buying: {
		title: "Buying on ShopSmart",
		description: "Everything you need to know about finding, ordering, and receiving auto parts.",
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
			{
				q: "Can I negotiate the price with a seller?",
				a: "Yes. Use the in-app messaging to contact the seller directly and discuss pricing. Any agreed price changes must be reflected in a new or revised listing before payment.",
			},
			{
				q: "What if the part doesn't fit my car?",
				a: "You can raise a dispute within 3 days of delivery. If the part was not as described, you are entitled to a full refund via escrow release.",
			},
		],
	},
	selling: {
		title: "Selling on ShopSmart",
		description: "Learn how to list parts, manage orders, and grow your seller business.",
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
			{
				q: "Can I list used parts?",
				a: "Yes. ShopSmart supports new, used, refurbished, and aftermarket parts. You must accurately describe the condition of each listing.",
			},
			{
				q: "How many photos should I include?",
				a: "We recommend at least 3 clear photos from different angles. Listings with more photos typically sell faster.",
			},
		],
	},
	payments: {
		title: "Payments & Escrow",
		description: "Understand how payments, escrow, and wallet withdrawals work.",
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
			{
				q: "How do I withdraw from my wallet?",
				a: "Go to your wallet page and select 'Withdraw'. Funds can be transferred to your JazzCash or bank account within 1–2 business days.",
			},
			{
				q: "Are there any withdrawal fees?",
				a: "No. ShopSmart does not charge withdrawal fees. Your bank or mobile wallet provider may apply their own transaction fees.",
			},
		],
	},
	disputes: {
		title: "Disputes & Returns",
		description: "How to raise, track, and resolve disputes on ShopSmart.",
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
			{
				q: "What evidence should I provide?",
				a: "Photos of the received part, photos of the listing, and any messages between you and the seller. The more evidence, the faster the resolution.",
			},
			{
				q: "Can disputes be appealed?",
				a: "Yes. If you disagree with a dispute decision, you may submit an appeal within 7 days. Appeals are reviewed by a senior support team member.",
			},
		],
	},
	"mechanic-verification": {
		title: "Mechanic Verification",
		description: "How mechanic verification works and what to expect.",
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
			{
				q: "What if the mechanic says the part is incompatible?",
				a: "You can cancel your order with a full refund if the mechanic's verdict is 'incompatible' and the escrow has not yet been released.",
			},
			{
				q: "Can I choose a specific mechanic?",
				a: "Not yet. Requests are matched to available mechanics in your city automatically to ensure the fastest response.",
			},
		],
	},
};

// ----------------------------------------------------------------------------
// Static generation
// ----------------------------------------------------------------------------

export function generateStaticParams() {
	return Object.keys(SECTIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const section = SECTIONS[slug];
	if (!section) return { title: "Help — ShopSmart" };

	return {
		title: `${section.title} — ShopSmart Help`,
		description: section.description,
	};
}

// ----------------------------------------------------------------------------
// FAQ item (native details/summary)
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

export default async function HelpSectionPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const section = SECTIONS[slug];

	if (!section) notFound();

	return (
		<div container-id="help-section-page" className="mx-auto max-w-3xl px-4 py-12">

			{/* Back */}
			<Link
				href="/help"
				className="mb-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ChevronLeft className="size-4" aria-hidden />
				Help Centre
			</Link>

			{/* Header */}
			<div container-id="section-header" className="mb-8 flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">{section.title}</h1>
				<p className="text-muted-foreground">{section.description}</p>
			</div>

			{/* FAQs */}
			<Card size="sm">
				<CardContent className="pt-4">
					<Separator className="mb-3" />
					{section.faqs.map((faq) => (
						<FaqItem key={faq.q} faq={faq} />
					))}
				</CardContent>
			</Card>

			{/* CTA */}
			<div container-id="section-cta" className="mt-10 text-center">
				<p className="text-sm text-muted-foreground">
					Still have questions?{" "}
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
