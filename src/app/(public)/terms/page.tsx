// ============================================================================
// Terms of Service Page
// ============================================================================
//
// Static terms of service covering buyer obligations, seller obligations,
// prohibited items, and dispute resolution process.

import type { Metadata } from "next";

import { Separator } from "@/components/primitives/separator";

export const metadata: Metadata = {
	title: "Terms of Service — ShopSmart",
	description: "The terms and conditions governing use of the ShopSmart marketplace.",
};

// ----------------------------------------------------------------------------
// Section component
// ----------------------------------------------------------------------------

function TermsSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section container-id="terms-section" className="flex flex-col gap-3">
			<h2 className="text-xl font-bold">{title}</h2>
			<div className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
				{children}
			</div>
		</section>
	);
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function TermsPage() {
	return (
		<div container-id="terms-page" className="mx-auto max-w-3xl px-4 py-12">

			{/* Header */}
			<div container-id="terms-header" className="mb-8 flex flex-col gap-2">
				<h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
				<p className="text-sm text-muted-foreground">Last updated: January 2025</p>
			</div>

			<p className="mb-8 text-muted-foreground leading-relaxed">
				These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
				ShopSmart marketplace. By creating an account or placing an order, you agree to
				be bound by these Terms. Please read them carefully.
			</p>

			<div container-id="terms-sections" className="flex flex-col gap-8">

				{/* Buyer obligations */}
				<TermsSection title="1. Buyer obligations">
					<p>
						<strong className="text-foreground">Accurate information:</strong> You must
						provide accurate vehicle information when requesting mechanic verification or
						submitting a dispute.
					</p>
					<p>
						<strong className="text-foreground">Good-faith purchasing:</strong> You
						agree to complete payment for orders you place. Repeatedly abandoning
						confirmed orders may result in account suspension.
					</p>
					<p>
						<strong className="text-foreground">Timely confirmation:</strong> After
						receiving a delivery, you must confirm receipt within 3 business days. If
						you do not confirm or raise a dispute, the escrow is automatically released
						to the seller.
					</p>
					<p>
						<strong className="text-foreground">Honest disputes:</strong> Disputes must
						be raised in good faith. Fraudulent or exaggerated dispute claims are a
						violation of these Terms and may result in permanent account suspension.
					</p>
				</TermsSection>

				<Separator />

				{/* Seller obligations */}
				<TermsSection title="2. Seller obligations">
					<p>
						<strong className="text-foreground">Accurate listings:</strong> All listings
						must accurately describe the part's condition, compatibility, and
						specifications. Misleading listings are prohibited.
					</p>
					<p>
						<strong className="text-foreground">Timely shipping:</strong> Sellers must
						ship orders within the dispatch window stated in their listing. Failure to
						ship without notifying the buyer may result in automatic order cancellation
						and a negative seller mark.
					</p>
					<p>
						<strong className="text-foreground">Dispute response:</strong> Sellers must
						respond to buyer disputes within 48 hours. Non-response results in an
						automatic ruling in the buyer's favour.
					</p>
					<p>
						<strong className="text-foreground">Platform fee:</strong> Sellers agree to
						a 5% platform fee deducted from each successful sale before payout.
					</p>
					<p>
						<strong className="text-foreground">Identity verification:</strong> Sellers
						must complete identity verification before receiving payouts. ShopSmart
						reserves the right to withhold payouts pending verification.
					</p>
				</TermsSection>

				<Separator />

				{/* Prohibited items */}
				<TermsSection title="3. Prohibited items">
					<p>The following are strictly prohibited on ShopSmart:</p>
					<ul className="ml-4 list-disc space-y-1">
						<li>Counterfeit or clone parts listed as genuine OEM</li>
						<li>Parts stolen or obtained through unlawful means</li>
						<li>Parts that have failed safety inspections or have been recalled</li>
						<li>Weapons, ammunition, or illegal modifications</li>
						<li>Substances or chemicals not classified as automotive fluids</li>
						<li>Digital goods, non-automotive items, or services</li>
					</ul>
					<p>
						Violations result in immediate listing removal and may lead to permanent
						account suspension and referral to law enforcement.
					</p>
				</TermsSection>

				<Separator />

				{/* Disputes */}
				<TermsSection title="4. Disputes and resolution">
					<p>
						ShopSmart provides an escrow-backed dispute resolution system. When a buyer
						raises a dispute, all funds are frozen until the matter is resolved.
					</p>
					<p>
						<strong className="text-foreground">Process:</strong> Both parties submit
						evidence. ShopSmart's support team reviews within 5 business days and issues
						a binding decision.
					</p>
					<p>
						<strong className="text-foreground">Mechanic involvement:</strong> For
						compatibility disputes, ShopSmart may engage a certified mechanic to provide
						an independent technical verdict at no additional cost to either party.
					</p>
					<p>
						<strong className="text-foreground">Appeals:</strong> Either party may
						appeal a dispute decision within 7 days by contacting
						{" "}
						<a
							href="mailto:support@shopsmart.pk"
							className="text-primary underline-offset-4 hover:underline"
						>
							support@shopsmart.pk
						</a>
						.
					</p>
					<p>
						ShopSmart's decisions are final after the appeal period. ShopSmart is not
						liable for the quality of parts beyond the protections offered through the
						escrow and dispute systems described here.
					</p>
				</TermsSection>

				<Separator />

				{/* Governing law */}
				<TermsSection title="5. Governing law">
					<p>
						These Terms are governed by the laws of the Islamic Republic of Pakistan.
						Any disputes arising from these Terms shall be subject to the exclusive
						jurisdiction of the courts of Karachi, Pakistan.
					</p>
					<p>
						For questions about these Terms, contact us at{" "}
						<a
							href="mailto:support@shopsmart.pk"
							className="text-primary underline-offset-4 hover:underline"
						>
							support@shopsmart.pk
						</a>
						.
					</p>
				</TermsSection>
			</div>
		</div>
	);
}
