// ============================================================================
// ModelCard
// ============================================================================
//
// Clickable card linking to a model's listing page. Shows model image if
// available, then model name, year (if known), and "View listings →" prompt.

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Smartphone } from "lucide-react";

import type { Model } from "@/lib/features/product-catalog";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/primitives/card";

type ModelCardProps = {
	model: Model;
	href: string;
	className?: string;
};

/** Model catalog card — image / icon, name, year, and view prompt. */
export function ModelCard({ model, href, className }: ModelCardProps) {
	return (
		<Link href={href} className="group block focus:outline-none">
			<Card
				size="sm"
				className={cn(
					"h-full cursor-pointer overflow-hidden transition-all group-hover:border-foreground/20 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring",
					className,
				)}
			>
				{/* Model image / placeholder */}
				<div className="flex h-28 items-center justify-center bg-muted/30 transition-colors group-hover:bg-muted/50">
					{model.image_url ? (
						<Image
							src={model.image_url}
							alt={model.name}
							width={80}
							height={96}
							className="max-h-24 w-auto object-contain drop-shadow-sm"
						/>
					) : (
						<Smartphone
							className="size-10 text-muted-foreground/30"
							aria-hidden
						/>
					)}
				</div>

				<CardContent className="flex items-center justify-between gap-2 py-3">
					<div className="flex min-w-0 flex-col gap-0.5">
						<p className="truncate text-sm font-semibold">{model.name}</p>
						<p className="text-[11px] text-muted-foreground">
							{model.year ? model.year : "View listings"}
						</p>
					</div>
					<ArrowRight
						className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
						aria-hidden
					/>
				</CardContent>
			</Card>
		</Link>
	);
}
