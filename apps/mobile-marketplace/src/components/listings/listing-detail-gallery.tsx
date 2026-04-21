/* eslint-disable @next/next/no-img-element -- listing image URLs are dynamic remote storage; configure `next/image` domains when ready. */
"use client";

import type { ListingImageRecord } from "@/lib/features/listings";
import { cn } from "@/lib/utils";

type ListingDetailGalleryProps = {
	images: ListingImageRecord[];
	title: string;
	className?: string;
};

export function ListingDetailGallery({ images, title, className }: ListingDetailGalleryProps) {
	if (!images.length) {
		return (
			<div
				container-id="listing-gallery-empty"
				className={cn(
					"flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground",
					className,
				)}
			>
				No photos yet
			</div>
		);
	}

	const primary = images[0];

	return (
		<div container-id="listing-gallery" className={cn("flex flex-col gap-3", className)}>
			<div
				container-id="listing-gallery-primary"
				className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10"
			>
				<img src={primary.url} alt={title} className="h-full w-full object-cover" />
			</div>
			{images.length > 1 ? (
				<div
					container-id="listing-gallery-thumbs"
					className="grid grid-cols-4 gap-2 sm:grid-cols-6"
				>
					{images.slice(1, 7).map((img) => (
						<div
							key={img.id}
							className="relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 transition-opacity hover:opacity-90"
						>
							<img src={img.url} alt="" className="h-full w-full object-cover" />
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
