// ============================================================================
// My Garage Page
// ============================================================================
//
// Authenticated placeholder for the buyer's saved-vehicles feature. Until a
// dedicated garage/vehicles table exists, this surface shows an instructional
// empty state that links buyers toward browsing. Future iterations will render
// vehicle cards with compatible-parts deep links.

import { redirect } from "next/navigation";
import Link from "next/link";

import { getServerSession } from "@/lib/auth/guards";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default async function GaragePage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/garage");

	return (
		<div container-id="garage-page" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* Header */}
			<header container-id="garage-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">My Garage</h1>
				<p className="text-sm text-muted-foreground">
					Track vehicles you own and find matching parts
				</p>
			</header>

			{/* Empty state */}
			<div
				container-id="garage-empty"
				className="flex flex-col flex-1 min-h-0 items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center"
			>
				<div container-id="garage-empty-text" className="flex flex-col gap-2">
					<p className="text-base font-semibold">Coming soon</p>
					<p className="text-sm text-muted-foreground max-w-xs mx-auto">
						Save vehicles you own to get personalised part recommendations tailored
						to your make, model, and year.
					</p>
				</div>
				<Link
					href="/browse"
					className={cn(buttonVariants({ variant: "outline" }))}
				>
					Browse Vehicles
				</Link>
			</div>
		</div>
	);
}
