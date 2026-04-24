// ============================================================================
// Privacy Policy Page
// ============================================================================
//
// Static privacy policy with three core sections: data collected, how it is
// used, and user rights. Last updated date shown at the top.

import type { Metadata } from "next";

import { Separator } from "@/components/primitives/separator";

export const metadata: Metadata = {
	title: "Privacy Policy — ShopSmart",
	description: "How ShopSmart collects, uses, and protects your personal data.",
};

// ----------------------------------------------------------------------------
// Section component
// ----------------------------------------------------------------------------

function PolicySection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section container-id="policy-section" className="flex flex-col gap-3">
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

export default function PrivacyPage() {
	return (
		<div container-id="privacy-page" className="mx-auto max-w-3xl px-4 py-12">

			{/* Header */}
			<div container-id="privacy-header" className="mb-8 flex flex-col gap-2">
				<h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
				<p className="text-sm text-muted-foreground">Last updated: January 2025</p>
			</div>

			<p className="mb-8 text-muted-foreground leading-relaxed">
				ShopSmart (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to
				protecting your privacy. This policy explains what personal data we collect, why
				we collect it, and your rights over it. By using ShopSmart, you agree to the
				practices described here.
			</p>

			<div container-id="privacy-sections" className="flex flex-col gap-8">

				{/* Section 1: Data collected */}
				<PolicySection title="1. Data we collect">
					<p>
						<strong className="text-foreground">Account information:</strong> When you
						register, we collect your name, email address, phone number, and city.
					</p>
					<p>
						<strong className="text-foreground">Listing data:</strong> Part descriptions,
						photos, pricing, and vehicle compatibility information you provide when creating
						listings.
					</p>
					<p>
						<strong className="text-foreground">Transaction data:</strong> Payment
						amounts, wallet balances, escrow records, and order history necessary to
						process and settle transactions.
					</p>
					<p>
						<strong className="text-foreground">Messages:</strong> In-app chat messages
						between buyers and sellers, and messages to our support team.
					</p>
					<p>
						<strong className="text-foreground">Usage data:</strong> Pages visited,
						search queries, device type, and IP address, collected automatically when
						you use our platform.
					</p>
					<p>
						<strong className="text-foreground">Verification data:</strong> Identity
						documents and photos submitted during mechanic or seller verification.
					</p>
				</PolicySection>

				<Separator />

				{/* Section 2: How data is used */}
				<PolicySection title="2. How we use your data">
					<p>
						<strong className="text-foreground">Platform operations:</strong> To process
						orders, handle escrow, send delivery notifications, and resolve disputes.
					</p>
					<p>
						<strong className="text-foreground">Safety and fraud prevention:</strong> To
						detect suspicious activity, verify identities, and enforce our seller and
						buyer policies.
					</p>
					<p>
						<strong className="text-foreground">Recommendations:</strong> To personalise
						listing recommendations and search results based on your browsing history.
					</p>
					<p>
						<strong className="text-foreground">Support:</strong> To respond to your
						enquiries and resolve issues you report.
					</p>
					<p>
						<strong className="text-foreground">Legal obligations:</strong> To comply
						with applicable Pakistani laws, including tax and financial reporting
						requirements.
					</p>
					<p>
						We do not sell your personal data to third parties. We share data only with
						service providers (payment processors, SMS providers) strictly necessary to
						operate ShopSmart, and only under data processing agreements.
					</p>
				</PolicySection>

				<Separator />

				{/* Section 3: Your rights */}
				<PolicySection title="3. Your rights">
					<p>
						<strong className="text-foreground">Access:</strong> You may request a copy
						of the personal data we hold about you at any time.
					</p>
					<p>
						<strong className="text-foreground">Correction:</strong> You may update
						inaccurate or incomplete data via your account settings, or by contacting us.
					</p>
					<p>
						<strong className="text-foreground">Deletion:</strong> You may request
						deletion of your account and associated data. Certain records (transaction
						history) may be retained for legal and financial compliance purposes.
					</p>
					<p>
						<strong className="text-foreground">Portability:</strong> You may request
						an export of your data in a machine-readable format.
					</p>
					<p>
						<strong className="text-foreground">Objection:</strong> You may opt out of
						marketing communications at any time via your notification settings.
					</p>
					<p>
						To exercise any of these rights, email{" "}
						<a
							href="mailto:support@shopsmart.pk"
							className="text-primary underline-offset-4 hover:underline"
						>
							support@shopsmart.pk
						</a>
						. We will respond within 30 days.
					</p>
				</PolicySection>

				<Separator />

				{/* Contact */}
				<PolicySection title="4. Contact">
					<p>
						For privacy-related questions or concerns, contact our data protection team
						at{" "}
						<a
							href="mailto:support@shopsmart.pk"
							className="text-primary underline-offset-4 hover:underline"
						>
							support@shopsmart.pk
						</a>
						.
					</p>
				</PolicySection>
			</div>
		</div>
	);
}
