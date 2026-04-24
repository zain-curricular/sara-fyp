// ============================================================================
// Garage Vehicle Detail Page
// ============================================================================
//
// Placeholder for an individual saved vehicle. Shows a prompt to browse
// compatible parts by linking to the search page filtered by model ID.
// Will be replaced with a full vehicle card + parts grid once the garage
// data model is implemented.

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type GarageVehiclePageProps = {
	params: Promise<{ id: string }>;
};

export default async function GarageVehiclePage({ params }: GarageVehiclePageProps) {
	const { id } = await params;

	return (
		<div container-id="garage-vehicle-page" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* Header */}
			<header container-id="garage-vehicle-header" className="flex flex-col gap-1">
				<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					My Garage
				</p>
				<h1 className="text-2xl font-bold tracking-tight">Vehicle saved</h1>
			</header>

			{/* Prompt */}
			<div
				container-id="garage-vehicle-prompt"
				className="flex flex-col gap-4 rounded-xl border border-border p-6"
			>
				<p className="text-sm text-muted-foreground">
					Browse parts compatible with this vehicle using the link below.
				</p>
				<Link
					href={`/search?model_id=${id}`}
					className={cn(buttonVariants({ variant: "default" }), "self-start")}
				>
					Find Compatible Parts
				</Link>
			</div>
		</div>
	);
}
