"use client";

import type { CategoryOption, ListingRecord } from "@/lib/features/listings";
import { ListingEditForm } from "@/components/listings/listing-edit-form";

type EditListingShellProps = {
	listing: ListingRecord;
	categories: CategoryOption[];
};

export default function EditListingShell({ listing, categories }: EditListingShellProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
				<p className="text-sm text-muted-foreground">
					Update details for <span className="font-medium text-foreground">{listing.title}</span>.
				</p>
			</div>
			<ListingEditForm listing={listing} categories={categories} />
		</div>
	);
}
