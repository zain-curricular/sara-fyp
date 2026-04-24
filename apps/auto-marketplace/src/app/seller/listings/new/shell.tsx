"use client";

import type { CategoryOption } from "@/lib/features/listings";
import { CreateListingWizard } from "@/components/listings/create-listing-wizard";

type NewListingShellProps = {
	categories: CategoryOption[];
};

export default function NewListingShell({ categories }: NewListingShellProps) {
	return (
		<div container-id="new-listing-shell" className="mx-auto flex w-full max-w-2xl flex-col gap-8">
			<header className="flex flex-col gap-1">
				<h1 className="text-3xl font-semibold tracking-tight">New listing</h1>
				<p className="text-sm text-muted-foreground">
					Add details, photos, then publish when you are ready.
				</p>
			</header>
			<CreateListingWizard categories={categories} />
		</div>
	);
}
