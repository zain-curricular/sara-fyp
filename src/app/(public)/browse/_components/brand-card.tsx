// ============================================================================
// BrandCard
// ============================================================================
//
// Clickable card linking to a brand's model listing. Shows the brand logo
// image if available, otherwise a large initial letter in an accent circle.
// Displays brand name + "Browse models →" prompt.

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { Brand } from "@/lib/features/product-catalog";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/primitives/card";

type BrandCardProps = {
	brand: Brand;
	href: string;
	className?: string;
};

/** Brand catalog card — logo / initial, name, and browse prompt. */
export function BrandCard({ brand, href, className }: BrandCardProps) {
	const initial = brand.name.slice(0, 1).toUpperCase();

	return (
		<Link href={href} className="group block focus:outline-none">
			<Card
				size="sm"
				className={cn(
					"h-full cursor-pointer overflow-hidden transition-all group-hover:border-foreground/20 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring",
					className,
				)}
			>
				{/* Logo / initial */}
				<div className="flex h-24 items-center justify-center bg-muted/30 transition-colors group-hover:bg-muted/50">
					{brand.logo_url ? (
						<Image
							src={brand.logo_url}
							alt={brand.name}
							width={80}
							height={48}
							className="max-h-12 w-auto object-contain"
						/>
					) : (
						<span className="flex size-14 items-center justify-center rounded-full bg-background text-2xl font-bold text-muted-foreground shadow-sm">
							{initial}
						</span>
					)}
				</div>

				<CardContent className="flex items-center justify-between gap-2 py-3">
					<div className="flex flex-col gap-0.5">
						<p className="text-sm font-semibold">{brand.name}</p>
						<p className="text-[11px] text-muted-foreground">Browse models</p>
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
