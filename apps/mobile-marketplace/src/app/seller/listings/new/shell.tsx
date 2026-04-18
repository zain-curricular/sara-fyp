"use client";

import type { CategoryOption } from "@/lib/features/listings";
import { CreateListingWizard } from "@/components/listings/create-listing-wizard";

type NewListingShellProps = {
	categories: CategoryOption[];
};

export default function NewListingShell({ categories }: NewListingShellProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">New listing</h1>
				<p className="text-sm text-muted-foreground">
					Add details, photos, then publish when you are ready.
				</p>
			</div>
			<CreateListingWizard categories={categories} />
		</div>
	);
}
