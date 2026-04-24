// ============================================================================
// Part Verification Result Page
// ============================================================================
//
// Fetches a listing by ID and renders one of three states:
//   - Active listing found → green verified badge + part details
//   - Inactive / sold listing → yellow warning (was listed, no longer active)
//   - Not found → red X (unrecognised part ID, possible counterfeit)
//
// No auth required — QR codes are scanned by anyone handling the part.

import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

type VerifyResultPageProps = {
	params: Promise<{ partId: string }>;
};

export default async function VerifyResultPage({ params }: VerifyResultPageProps) {
	const { partId } = await params;

	const supabase = await createServerSupabaseClient();

	const { data: listing } = await supabase
		.from("listings")
		.select("id, title, condition, status, created_at, city, listing_condition, ai_generated_fields, price, deleted_at")
		.eq("id", partId)
		.maybeSingle();

	// --- Not found ---
	if (!listing) {
		return (
			<div container-id="verify-result-page" className="flex flex-col flex-1 min-h-0 items-center justify-center p-4">
				<Card container-id="verify-not-found" className="w-full max-w-md border-destructive/40">
					<CardHeader container-id="verify-not-found-header" className="flex flex-col items-center gap-3 text-center">
						<XCircle className="size-12 text-destructive" aria-hidden />
						<CardTitle className="text-xl text-destructive">Could Not Verify</CardTitle>
					</CardHeader>
					<CardContent container-id="verify-not-found-body" className="flex flex-col items-center gap-4 text-center">
						<p className="text-sm text-muted-foreground">
							This part could not be verified. It may not be listed on ShopSmart.
						</p>
						<Link
							href="/verify"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Try Another ID
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	// --- Deleted / inactive ---
	if (listing.deleted_at || listing.status !== "active") {
		return (
			<div container-id="verify-result-page" className="flex flex-col flex-1 min-h-0 items-center justify-center p-4">
				<Card container-id="verify-inactive" className="w-full max-w-md border-amber-500/40">
					<CardHeader container-id="verify-inactive-header" className="flex flex-col items-center gap-3 text-center">
						<AlertTriangle className="size-12 text-amber-500" aria-hidden />
						<CardTitle className="text-xl text-amber-600">No Longer Available</CardTitle>
					</CardHeader>
					<CardContent container-id="verify-inactive-body" className="flex flex-col items-center gap-4 text-center">
						<p className="text-sm font-medium">{listing.title}</p>
						<p className="text-sm text-muted-foreground">
							This part was previously listed but is no longer available.
						</p>
						<Link
							href="/parts"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Browse Parts
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	// --- Active / verified ---
	const condition = listing.listing_condition ?? listing.condition ?? "unknown";

	return (
		<div container-id="verify-result-page" className="flex flex-col flex-1 min-h-0 items-center justify-center p-4">
			<Card container-id="verify-verified" className="w-full max-w-md border-green-500/40">
				<CardHeader container-id="verify-verified-header" className="flex flex-col items-center gap-3 text-center">
					<CheckCircle className="size-12 text-green-500" aria-hidden />
					<CardTitle className="text-xl text-green-600">Verified on ShopSmart</CardTitle>
				</CardHeader>
				<CardContent container-id="verify-verified-body" className="flex flex-col gap-4">

					{/* Part details */}
					<div container-id="verify-details" className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4">
						<p className="text-base font-semibold">{listing.title}</p>
						<div className="flex items-center gap-2 flex-wrap">
							<Badge variant="secondary" className="capitalize">{condition}</Badge>
							{listing.city && (
								<Badge variant="outline">{listing.city}</Badge>
							)}
						</div>
						{listing.price && (
							<p className="text-sm font-medium text-muted-foreground">
								Listed at {formatPKR(listing.price)}
							</p>
						)}
					</div>

					<p className="text-xs text-center text-muted-foreground">
						Listed on {new Date(listing.created_at).toLocaleDateString("en-PK", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</p>

					<Link
						href={`/listings/${listing.id}`}
						className={cn(buttonVariants({ variant: "default" }))}
					>
						View Full Listing
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
