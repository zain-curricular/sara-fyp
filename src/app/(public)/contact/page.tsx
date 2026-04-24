// ============================================================================
// Contact Page
// ============================================================================
//
// Static contact page. Form layout with no backend yet. Shows email,
// WhatsApp, and address for direct contact.

import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

export const metadata: Metadata = {
	title: "Contact Us — ShopSmart",
	description: "Get in touch with the ShopSmart team for support, partnerships, or enquiries.",
};

// ----------------------------------------------------------------------------
// Contact card
// ----------------------------------------------------------------------------

function ContactDetail({
	icon: Icon,
	label,
	value,
	href,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
	href?: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<Icon className="size-4 text-primary" aria-hidden />
			</div>
			<div className="flex flex-col gap-0.5">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				{href ? (
					<a
						href={href}
						className="text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						{value}
					</a>
				) : (
					<p className="text-sm font-medium">{value}</p>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function ContactPage() {
	return (
		<div container-id="contact-page" className="mx-auto max-w-4xl px-4 py-12">

			{/* Header */}
			<div container-id="contact-header" className="mb-10 flex flex-col gap-2">
				<h1 className="text-4xl font-bold tracking-tight">Contact us</h1>
				<p className="text-lg text-muted-foreground">
					We typically respond within 24 hours on business days.
				</p>
			</div>

			<div container-id="contact-grid" className="grid gap-8 lg:grid-cols-2">

				{/* Contact details */}
				<div container-id="contact-details" className="flex flex-col gap-6">
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Reach us directly</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
							<ContactDetail
								icon={Mail}
								label="Email"
								value="support@shopsmart.pk"
								href="mailto:support@shopsmart.pk"
							/>
							<Separator />
							<ContactDetail
								icon={Phone}
								label="WhatsApp"
								value="+92-300-0000000"
								href="https://wa.me/923000000000"
							/>
							<Separator />
							<ContactDetail
								icon={MapPin}
								label="Address"
								value="Karachi, Pakistan"
							/>
						</CardContent>
					</Card>

					<Card size="sm">
						<CardContent className="flex flex-col gap-3 pt-4">
							<p className="text-sm font-medium">Business hours</p>
							<div className="flex flex-col gap-1 text-sm text-muted-foreground">
								<div className="flex justify-between">
									<span>Monday – Friday</span>
									<span>9:00 AM – 6:00 PM PKT</span>
								</div>
								<div className="flex justify-between">
									<span>Saturday</span>
									<span>10:00 AM – 3:00 PM PKT</span>
								</div>
								<div className="flex justify-between">
									<span>Sunday</span>
									<span>Closed</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Contact form (static layout — no backend yet) */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Send a message</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="flex flex-col gap-4" action="#">

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="contact-name">Full name</Label>
									<Input id="contact-name" placeholder="Ahmed Ali" />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="contact-email">Email</Label>
									<Input id="contact-email" type="email" placeholder="ahmed@example.com" />
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="contact-subject">Subject</Label>
								<Input id="contact-subject" placeholder="Order issue, listing question…" />
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="contact-message">Message</Label>
								<Textarea
									id="contact-message"
									placeholder="Describe your issue or question in detail…"
									rows={5}
								/>
							</div>

							<p className="text-xs text-muted-foreground">
								Form submissions are not yet connected to our system. Please email us directly
								at{" "}
								<a
									href="mailto:support@shopsmart.pk"
									className="text-primary underline-offset-4 hover:underline"
								>
									support@shopsmart.pk
								</a>{" "}
								for a faster response.
							</p>

							<Button type="submit" disabled className="w-full sm:w-auto">
								Send message (coming soon)
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
