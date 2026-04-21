"use client";

import type { CategoryOption, ListingRecord } from "@/lib/features/listings";
import { ListingEditForm } from "@/components/listings/listing-edit-form";

type EditListingShellProps = {
	listing: ListingRecord;
	categories: CategoryOption[];
};

export default function EditListingShell({ listing, categories }: EditListingShellProps) {
	return (
		<div container-id="edit-listing-shell" className="mx-auto flex w-full max-w-2xl flex-col gap-8">
			<header className="flex flex-col gap-1">
				<h1 className="text-3xl font-semibold tracking-tight">Edit listing</h1>
				<p className="text-sm text-muted-foreground">
					Update details for{" "}
					<span className="font-medium text-foreground">{listing.title}</span>.
				</p>
			</header>
			<ListingEditForm listing={listing} categories={categories} />
		</div>
	);
}
